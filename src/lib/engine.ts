import { prisma } from './prisma';
import { PRIZE_LEVELS, MAX_COMBOS, MAX_RANDOM, CODE_LEN, TIERS, MICRO } from './constants';
import { randomCode, newSalt, commitHash, matchLevel, expandCombos, deriveCode } from './lottery';
import type { Round } from '../generated/prisma/client';

/* ------------------------------------------------------------------ */
/* 期次管理                                                            */
/* ------------------------------------------------------------------ */

export async function createRound(input: {
  betCloseAt: Date;
  drawAt: Date;
  basePriceHOD?: number;
  returnRate?: number;
}): Promise<Round> {
  const now = new Date();
  const betCloseAt = new Date(input.betCloseAt);
  const drawAt = new Date(input.drawAt);
  if (Number.isNaN(betCloseAt.getTime()) || Number.isNaN(drawAt.getTime())) {
    throw new Error('时间格式无效');
  }
  if (drawAt <= betCloseAt) throw new Error('开奖时间必须晚于投注截止时间');
  if (betCloseAt <= now) throw new Error('投注截止时间必须晚于当前时间');

  const basePrice = BigInt(Math.round((input.basePriceHOD ?? 1) * Number(MICRO)));
  if (basePrice <= 0n) throw new Error('每注基础价无效');
  const returnRate = input.returnRate ?? 80;
  if (!Number.isInteger(returnRate) || returnRate <= 0 || returnRate > 100) {
    throw new Error('返奖率需为 1-100 的整数');
  }

  // 开奖码由盐值 + 服务器密钥派生，仅公示哈希承诺，码本身不入库
  const salt = newSalt();
  const code = deriveCode(salt);
  const codeHash = commitHash(code, salt);

  return prisma.$transaction(async (tx) => {
    const last = await tx.round.findFirst({ orderBy: { roundNo: 'desc' } });
    const roundNo = (last?.roundNo ?? 0) + 1;

    // 吸收此前未被后续期次吸收的滚存大奖
    let rolloverFrom = 0n;
    const pending = await tx.round.findMany({
      where: { rolloverDone: false, rolloverTo: { gt: 0 } },
    });
    for (const r of pending) {
      rolloverFrom += r.rolloverTo;
      await tx.round.update({ where: { id: r.id }, data: { rolloverDone: true } });
    }

    return tx.round.create({
      data: {
        roundNo,
        betCloseAt,
        drawAt,
        basePrice,
        returnRate,
        salt,
        codeHash,
        rolloverFrom,
      },
    });
  });
}

/* ------------------------------------------------------------------ */
/* 投注                                                                */
/* ------------------------------------------------------------------ */

export interface PlaceBetsInput {
  roundId: string; // 参与期次（管理员发布的活动/期次）
  mode: 'single' | 'multi' | 'random';
  code?: string; // single：6 位码
  positions?: string[][]; // multi：每位可选数字集合
  codes?: string[]; // random：机选码列表
  tier: number; // 1 | 10 | 100
}

export async function placeBets(userId: string, input: PlaceBetsInput) {
  if (!TIERS.some((t) => t.value === input.tier)) throw new Error('投入档位无效');

  const codes = resolveCodes(input);
  if (!codes.length) throw new Error('请先选择竞猜码');

  return prisma.$transaction(async (tx) => {
    // 事务内复查期次状态，防止 TOCTOU 竞态
    const round = await tx.round.findUnique({ where: { id: input.roundId } });
    if (!round) throw new Error('期次不存在');
    if (round.status !== 'OPEN' || round.betCloseAt <= new Date()) throw new Error('该期已截止投注');

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');

    const stake = round.basePrice * BigInt(input.tier);
    const cost = BigInt(codes.length) * stake;

    if (user.balance < cost) throw new Error('算力余额不足');

    const balanceAfter = user.balance - cost;
    let firstBetId = '';

    for (const code of codes) {
      const bet = await tx.bet.create({
        data: { userId, roundId: round.id, code, tier: input.tier, stake },
      });
      if (!firstBetId) firstBetId = bet.id;
    }
    await tx.round.update({ where: { id: round.id }, data: { totalSales: { increment: cost } } });
    await tx.user.update({ where: { id: userId }, data: { balance: balanceAfter } });
    await tx.tx.create({
      data: {
        userId,
        type: 'BET',
        amount: -cost,
        balanceAfter,
        refId: firstBetId,
        note: `第${round.roundNo}期 投注 ${codes.length} 注 × ${input.tier}x 档`,
      },
    });

    return { created: codes.length, cost, balance: balanceAfter };
  });
}

function resolveCodes(input: PlaceBetsInput): string[] {
  if (input.mode === 'single') {
    const code = input.code;
    if (!code || !/^\d{6}$/.test(code)) throw new Error('竞猜码须为 6 位数字');
    return [code];
  }
  if (input.mode === 'multi') {
    const positions = input.positions;
    if (!Array.isArray(positions) || positions.length !== CODE_LEN) throw new Error('复式选号格式错误');
    const sets: string[][] = positions.map((p) => {
      if (!Array.isArray(p) || !p.length) throw new Error('每个位置至少选择一个数字');
      const digits = Array.from(new Set(p.map((d) => String(d)))).filter((d) => /^\d$/.test(d));
      if (!digits.length) throw new Error('存在无效数字');
      return digits;
    });
    const combos = sets.reduce((acc, s) => acc * s.length, 1);
    if (combos > MAX_COMBOS) throw new Error(`复式注数超过上限（${MAX_COMBOS} 注）`);
    return expandCombos(sets);
  }
  // random
  const codes = input.codes ?? [];
  if (codes.length < 1 || codes.length > MAX_RANDOM) throw new Error(`机选注数需在 1-${MAX_RANDOM} 之间`);
  for (const c of codes) {
    if (!/^\d{6}$/.test(c)) throw new Error('机选码格式错误');
  }
  return codes;
}

/* ------------------------------------------------------------------ */
/* 开奖结算                                                            */
/* ------------------------------------------------------------------ */

export async function settleRound(roundId: string) {
  const t0 = Date.now();
  const result = await prisma.$transaction(async (tx) => {
    const round = await tx.round.findUnique({ where: { id: roundId } });
    if (!round) throw new Error('期次不存在');
    if (round.status !== 'LOCKED') return { skipped: true, status: round.status };

    if (!round.salt) throw new Error('开奖盐值缺失');
    const win = deriveCode(round.salt);

    const bets = await tx.bet.findMany({ where: { roundId, status: 'ACTIVE' } });

    // 各级奖池 = 销售额 × 返奖率 × 该级占比（整数截断，余数归平台留存）
    const totalSales = round.totalSales;
    let platformProfit = totalSales;
    const levelPools = new Map<number, bigint>();
    for (const L of PRIZE_LEVELS) {
      const pool = (totalSales * BigInt(round.returnRate) * BigInt(L.pct)) / 10000n;
      levelPools.set(L.level, pool);
      platformProfit -= pool;
    }
    // 滚存并入一等奖
    levelPools.set(1, (levelPools.get(1) ?? 0n) + round.rolloverFrom);

    // 奖级匹配（取最高等级）
    const winners = new Map<number, { betId: string; userId: string; stake: bigint }[]>();
    for (const bet of bets) {
      const level = matchLevel(bet.code, win);
      if (level !== null) {
        const arr = winners.get(level) ?? [];
        arr.push({ betId: bet.id, userId: bet.userId, stake: bet.stake });
        winners.set(level, arr);
      }
    }

    let distributed = 0n;
    let rolloverTo = 0n;
    const levelSummary: { level: number; name: string; winners: number; paid: number }[] = [];

    for (const L of PRIZE_LEVELS) {
      // 第 7 级（保底奖）在下方独立处理，此处跳过避免重复
      if (L.level === 7) continue;

      const pool = levelPools.get(L.level) ?? 0n;
      const list = winners.get(L.level) ?? [];
      if (!list.length) {
        if (L.level === 1 && pool > 0n) {
          rolloverTo = pool;        // 一等奖无人中 → 滚存至下一期
        } else {
          platformProfit += pool;   // 2-6 级无人中 → 奖池归平台留存
        }
        levelSummary.push({ level: L.level, name: L.name, winners: 0, paid: 0 });
        continue;
      }
      // 同级按投入占比均分（先算奖金，再按用户聚合一次写入）
      const totalStake = list.reduce((s, w) => s + w.stake, 0n);
      let paid = 0n;
      // 先算每人每注的奖金，不写库
      const payouts = list.map((w) => {
        const prize = (pool * w.stake) / totalStake;
        paid += prize;
        return { ...w, prize };
      });
      // 按用户聚合总奖金
      const userSum = new Map<string, { total: bigint; bets: { betId: string; prize: bigint }[] }>();
      for (const p of payouts) {
        const s = userSum.get(p.userId) ?? { total: 0n, bets: [] };
        s.total += p.prize;
        s.bets.push({ betId: p.betId, prize: p.prize });
        userSum.set(p.userId, s);
      }
      // 一次写用户余额 + 流水
      for (const [uid, s] of userSum) {
        const u = await tx.user.findUnique({ where: { id: uid } });
        if (u) {
          await tx.user.update({ where: { id: uid }, data: { balance: u.balance + s.total } });
          await tx.tx.create({
            data: { userId: uid, type: 'PRIZE', amount: s.total, balanceAfter: u.balance + s.total, refId: s.bets[0].betId, note: `第${round.roundNo}期 ${L.name}` },
          });
        }
      }
      // 批量写注状态（仍逐注，但无用户查询，快很多）
      for (const p of payouts) {
        await tx.bet.update({ where: { id: p.betId }, data: { status: 'WON', winLevel: L.level, prize: p.prize } });
      }
      platformProfit += pool - paid;
      distributed += paid;
      levelSummary.push({ level: L.level, name: L.name, winners: list.length, paid: Number(paid) });
    }

    // 保底奖（第 7 级）：所有未中奖的注单瓜分保底奖池——绝不空手（按用户聚合一次写入）
    const level7Pool = levelPools.get(7) ?? 0n;
    if (level7Pool > 0n) {
      const losers = await tx.bet.findMany({ where: { roundId, status: 'ACTIVE' } });
      if (losers.length > 0) {
        const totalStake = losers.reduce((s, b) => s + b.stake, 0n);
        // 先算每注奖金
        const payouts = losers.map((b) => ({ ...b, prize: (level7Pool * b.stake) / totalStake }));
        let paid7 = 0n;
        const userSum = new Map<string, { total: bigint; firstBetId: string }>();
        for (const p of payouts) {
          paid7 += p.prize;
          const s = userSum.get(p.userId) ?? { total: 0n, firstBetId: p.id };
          s.total += p.prize;
          userSum.set(p.userId, s);
        }
        for (const [uid, s] of userSum) {
          const u = await tx.user.findUnique({ where: { id: uid } });
          if (u) {
            await tx.user.update({ where: { id: uid }, data: { balance: u.balance + s.total } });
            await tx.tx.create({ data: { userId: uid, type: 'PRIZE', amount: s.total, balanceAfter: u.balance + s.total, refId: s.firstBetId, note: `第${round.roundNo}期 保底奖` } });
          }
        }
        // 批量写注状态（仍逐注，无用户查询）
        for (const p of payouts) {
          await tx.bet.update({ where: { id: p.id }, data: { status: 'WON', winLevel: 7, prize: p.prize } });
        }
        platformProfit += level7Pool - paid7;
        distributed += paid7;
        levelSummary.push({ level: 7, name: '保底奖', winners: losers.length, paid: Number(paid7) });
      } else {
        platformProfit += level7Pool;
        levelSummary.push({ level: 7, name: '保底奖', winners: 0, paid: 0 });
      }
    } else {
      await tx.bet.updateMany({ where: { roundId, status: 'ACTIVE' }, data: { status: 'LOST' } });
      levelSummary.push({ level: 7, name: '保底奖', winners: 0, paid: 0 });
    }

    // 滚存传导：优先并入已存在的下一期
    let rolloverDone = false;
    if (rolloverTo > 0n) {
      const next = await tx.round.findFirst({
        where: { roundNo: { gt: round.roundNo }, status: { in: ['OPEN', 'LOCKED'] } },
        orderBy: { roundNo: 'asc' },
      });
      if (next) {
        await tx.round.update({
          where: { id: next.id },
          data: { rolloverFrom: { increment: rolloverTo } },
        });
        rolloverDone = true;
      }
    }

    await tx.round.update({
      where: { id: roundId },
      data: {
        status: 'DRAWN',
        winningCode: win,
        prizePool: distributed,
        platformProfit,
        rolloverTo,
        rolloverDone,
        drawnAt: new Date(),
      },
    });

    return {
      skipped: false,
      roundNo: round.roundNo,
      win,
      salt: round.salt,
      distributed: Number(distributed),
      rolloverTo: Number(rolloverTo),
      platformProfit: Number(platformProfit),
      levelSummary,
    };
  });
  console.log(`[engine] 期次结算完成 roundId=${roundId} 耗时 ${Date.now() - t0}ms`);
  return result;
}

/* ------------------------------------------------------------------ */
/* 取消期次（全额退款）                                                 */
/* ------------------------------------------------------------------ */

export async function cancelRound(roundId: string) {
  return prisma.$transaction(async (tx) => {
    const round = await tx.round.findUnique({ where: { id: roundId } });
    if (!round) throw new Error('期次不存在');
    if (round.status === 'DRAWN' || round.status === 'CANCELED') throw new Error('该期不可取消');

    const bets = await tx.bet.findMany({ where: { roundId, status: 'ACTIVE' } });
    for (const bet of bets) {
      const u = await tx.user.findUnique({ where: { id: bet.userId } });
      if (u) {
        const balanceAfter = u.balance + bet.stake;
        await tx.user.update({ where: { id: bet.userId }, data: { balance: balanceAfter } });
        await tx.tx.create({
          data: {
            userId: bet.userId,
            type: 'REFUND',
            amount: bet.stake,
            balanceAfter,
            refId: bet.id,
            note: `第${round.roundNo}期取消退款`,
          },
        });
      }
    }
    await tx.bet.updateMany({ where: { roundId, status: 'ACTIVE' }, data: { status: 'REFUNDED' } });

    // 滚存转入待吸收状态，后续期次创建时回收
    await tx.round.update({
      where: { id: roundId },
      data: {
        status: 'CANCELED',
        totalSales: 0n,
        rolloverTo: round.rolloverFrom,
        rolloverFrom: 0n,
        rolloverDone: false,
      },
    });

    return { refunded: bets.length };
  });
}

/* ------------------------------------------------------------------ */
/* 调度 tick：自动截止 + 自动开奖                                       */
/* ------------------------------------------------------------------ */

export async function tick() {
  const now = new Date();
  const locked = await prisma.round.updateMany({
    where: { status: 'OPEN', betCloseAt: { lte: now } },
    data: { status: 'LOCKED' },
  });
  const due = await prisma.round.findMany({
    where: { status: 'LOCKED', drawAt: { lte: now } },
    select: { id: true },
  });
  for (const r of due) {
    try {
      await settleRound(r.id);
    } catch (e) {
      console.error('[engine] 自动开奖失败', r.id, e);
    }
  }
  return { locked: locked.count, settled: due.length };
}
