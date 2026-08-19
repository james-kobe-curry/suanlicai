import type { Round, Bet, Tx, User, RedeemCode } from '../generated/prisma/client';

/**
 * 序列化实体供 JSON 传输：
 * - BigInt → Number（金额 < 2^53，安全）
 * - 开奖码与盐仅在该期已开奖（DRAWN）后公开
 */
export function serRound(r: Round) {
  const drawn = r.status === 'DRAWN';
  return {
    id: r.id,
    roundNo: r.roundNo,
    status: r.status,
    basePrice: Number(r.basePrice),
    returnRate: r.returnRate,
    betCloseAt: r.betCloseAt.toISOString(),
    drawAt: r.drawAt.toISOString(),
    codeHash: r.codeHash,
    winningCode: drawn ? r.winningCode : null,
    salt: drawn ? r.salt : null,
    totalSales: Number(r.totalSales),
    prizePool: Number(r.prizePool),
    rolloverFrom: Number(r.rolloverFrom),
    rolloverTo: Number(r.rolloverTo),
    platformProfit: Number(r.platformProfit),
    drawnAt: r.drawnAt ? r.drawnAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

export function serBet(b: Bet & { round?: { roundNo: number; status: string } | null }) {
  return {
    id: b.id,
    roundId: b.roundId,
    roundNo: b.round?.roundNo ?? null,
    roundStatus: b.round?.status ?? null,
    code: b.code,
    tier: b.tier,
    stake: Number(b.stake),
    status: b.status,
    winLevel: b.winLevel,
    prize: Number(b.prize),
    createdAt: b.createdAt.toISOString(),
  };
}

export function serTx(t: Tx) {
  return {
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    balanceAfter: Number(t.balanceAfter),
    note: t.note,
    createdAt: t.createdAt.toISOString(),
  };
}

/** 管理端用户视图（含投注统计） */export function serUserAdmin(
  u: User & { _count?: { bets: number } },
  wonTotal = 0n
) {
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    status: u.status,
    phone: u.phone,
    email: u.email,
    platformId: u.platformId,
    boundAt: u.boundAt ? u.boundAt.toISOString() : null,
    balance: Number(u.balance),
    betCount: u._count?.bets ?? 0,
    wonTotal: Number(wonTotal),
    createdAt: u.createdAt.toISOString(),
  };
}

/** 兑换码视图（过期状态归一化） */
export function serRedeem(r: RedeemCode & { user?: { username: string } | null }) {
  const expired = r.status === 'UNUSED' && r.expiresAt !== null && r.expiresAt < new Date();
  return {
    id: r.id,
    code: r.code,
    amount: Number(r.amount),
    batch: r.batch,
    status: expired ? 'EXPIRED' : r.status,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    usedBy: r.user?.username ?? null,
    usedAt: r.usedAt ? r.usedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}
