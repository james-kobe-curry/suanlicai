/**
 * 演示种子数据：
 * - 管理员账号（来自 .env 的 ADMIN_USERNAME / ADMIN_PASSWORD）
 * - 两个演示用户 demo01 / demo02（密码 demo123456）
 * - 1 期已开奖（含各奖级中奖注单，走真实结算引擎）
 * - 2 期进行中（供投注与连续追期演示）
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { createRound, placeBets, settleRound } from '../src/lib/engine';
import { randomCode, deriveCode } from '../src/lib/lottery';
import { genUniqueRedeemCode } from '../src/lib/redeem';
import { MICRO } from '../src/lib/constants';

async function ensureUser(username: string, password: string, role: 'USER' | 'ADMIN', bonusHOD: number) {
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return exists;
  const balance = BigInt(bonusHOD) * MICRO;
  const user = await prisma.user.create({
    data: { username, passwordHash: await bcrypt.hash(password, 10), role, balance },
  });
  if (balance > 0n) {
    await prisma.tx.create({
      data: { userId: user.id, type: 'REGISTER_BONUS', amount: balance, balanceAfter: balance, note: '注册赠送算力' },
    });
  }
  console.log(`[seed] 创建用户 ${username}（${role}）`);
  return user;
}

/** 直接落库投注（绕过 OPEN 校验，用于构造已开奖演示期） */
async function seedBet(userId: string, roundId: string, code: string, tier: number) {
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  const stake = round.basePrice * BigInt(tier);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const balanceAfter = user.balance - stake;
  const bet = await prisma.bet.create({ data: { userId, roundId, code, tier, stake } });
  await prisma.user.update({ where: { id: userId }, data: { balance: balanceAfter } });
  await prisma.tx.create({
    data: {
      userId,
      type: 'BET',
      amount: -stake,
      balanceAfter,
      refId: bet.id,
      note: `第${round.roundNo}期 投注 1 注 × ${tier}x 档`,
    },
  });
  await prisma.round.update({ where: { id: roundId }, data: { totalSales: { increment: stake } } });
  return bet;
}

async function main() {
  const adminUser = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPass = process.env.ADMIN_PASSWORD ?? 'admin123';

  await ensureUser(adminUser, adminPass, 'ADMIN', 0);
  // 演示用户仅在非生产环境创建
  let demo1: { id: string } | null = null;
  let demo2: { id: string } | null = null;
  if (process.env.NODE_ENV !== 'production') {
    demo1 = await ensureUser('demo01', 'Demo123456!', 'USER', 5000);
    demo2 = await ensureUser('demo02', 'Demo123456!', 'USER', 5000);
  }

  // ── 演示兑换码（独立于期次初始化） ──
  if ((await prisma.redeemCode.count()) === 0) {
    const exists = async (c: string) => !!(await prisma.redeemCode.findUnique({ where: { code: c } }));
    const c100 = await genUniqueRedeemCode(exists);
    const c50 = await genUniqueRedeemCode(exists);
    const cDisabled = await genUniqueRedeemCode(exists);
    const cExpired = await genUniqueRedeemCode(exists);
    await prisma.redeemCode.createMany({
      data: [
        { code: c100, amount: 100n * MICRO, batch: '演示批次', status: 'UNUSED' },
        { code: c50, amount: 50n * MICRO, batch: '演示批次', status: 'UNUSED' },
        { code: cDisabled, amount: 10n * MICRO, batch: '演示批次', status: 'DISABLED' },
        {
          code: cExpired,
          amount: 20n * MICRO,
          batch: '演示批次',
          status: 'UNUSED',
          expiresAt: new Date(Date.now() - 24 * 3_600_000),
        },
      ],
    });
    console.log('[seed] 演示兑换码（未使用，可直接体验）:');
    console.log(`  ${c100} → +100 HOD`);
    console.log(`  ${c50} → +50 HOD`);
  }

  if ((await prisma.round.count()) > 0) {
    console.log('[seed] 已存在期次，跳过期次初始化');
    return;
  }

  const now = new Date();

  // ── 已开奖演示期 ──
  const r1 = await createRound({
    betCloseAt: new Date(now.getTime() + 60_000),
    drawAt: new Date(now.getTime() + 120_000),
  });
  const win = deriveCode(r1.salt!);
  const flip = (d: string) => (d === '9' ? '0' : String(Number(d) + 1));
  const prefix5 = win.slice(0, 5) + flip(win[5]);
  const pos3 = win.slice(0, 3) + flip(win[3]) + flip(win[4]) + flip(win[5]);
  let loseA = randomCode();
  while ([win, prefix5, pos3].includes(loseA)) loseA = randomCode();
  let loseB = randomCode();
  while ([win, prefix5, pos3, loseA].includes(loseB)) loseB = randomCode();

  if (demo1 && demo2) {
    await seedBet(demo1.id, r1.id, win, 10);
    await seedBet(demo1.id, r1.id, prefix5, 1);
    await seedBet(demo1.id, r1.id, pos3, 1);
    await seedBet(demo1.id, r1.id, loseA, 1);
    await seedBet(demo2.id, r1.id, win, 1);
    await seedBet(demo2.id, r1.id, prefix5, 10);
    await seedBet(demo2.id, r1.id, loseB, 1);
  }

  // 时间拨回过去并锁定，走真实结算引擎
  await prisma.round.update({
    where: { id: r1.id },
    data: {
      betCloseAt: new Date(now.getTime() - 2 * 3_600_000),
      drawAt: new Date(now.getTime() - 3_600_000),
      status: 'LOCKED',
    },
  });
  const settled = await settleRound(r1.id);
  console.log('[seed] 演示期已开奖:', JSON.stringify(settled, null, 2));

  // ── 两期进行中 ──
  const r2 = await createRound({
    betCloseAt: new Date(now.getTime() + 2 * 3_600_000),
    drawAt: new Date(now.getTime() + 2 * 3_600_000 + 5 * 60_000),
  });
  const r3 = await createRound({
    betCloseAt: new Date(now.getTime() + 26 * 3_600_000),
    drawAt: new Date(now.getTime() + 26 * 3_600_000 + 5 * 60_000),
  });

  if (demo1) await placeBets(demo1.id, { roundId: r2.id, mode: 'random', codes: ['123456', '654321'], tier: 10 });
  if (demo2) await placeBets(demo2.id, { roundId: r3.id, mode: 'single', code: '888888', tier: 1 });

  console.log('[seed] 完成：1 期已开奖演示 + 2 期进行中');
}

main()
  .catch((e) => {
    console.error('[seed] 失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
