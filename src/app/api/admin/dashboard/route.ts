import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';

const MICRO = 1_000_000;
function toHOD(n: bigint | number): number { return Number(n) / MICRO; }

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const [totalUsers, userTierRaw, salesAgg, profitAgg, active7dRaw, txTypeAgg, recentRounds] =
    await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.bet.groupBy({ by: ['userId'], _count: { _all: true } }),
      prisma.round.aggregate({ _sum: { totalSales: true, prizePool: true }, _avg: { returnRate: true } }),
      prisma.round.aggregate({ _sum: { platformProfit: true } }),
      (async () => {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return prisma.bet.groupBy({ by: ['userId'], where: { createdAt: { gte: d } } });
      })(),
      prisma.tx.groupBy({ by: ['type'], _sum: { amount: true } }),
      prisma.round.findMany({ where: { status: 'DRAWN' }, orderBy: { roundNo: 'desc' }, take: 20 }),
    ]);

  const totalBettors = userTierRaw.length;
  const repeatBettors = userTierRaw.filter((u) => u._count._all >= 2).length;
  const activeUsers7d = active7dRaw.length;
  const totalSalesHOD = toHOD(salesAgg._sum.totalSales ?? 0n);
  const totalPrizesHOD = toHOD(salesAgg._sum.prizePool ?? 0n);
  const expectedPrizesHOD = totalSalesHOD * ((salesAgg._avg.returnRate ?? 80) / 100);

  const platformProfitHOD = toHOD(profitAgg._sum.platformProfit ?? 0n);
  const healthScore = expectedPrizesHOD > 0 ? Math.round((totalPrizesHOD / expectedPrizesHOD) * 10000) / 100 : 100;

  // 动态分层：按用户投注次数分布自动划分 6 档，边界取 5 或 10 的倍数
  const counts = userTierRaw.map((u) => u._count._all).sort((a, b) => a - b);
  const NUM_TIERS = 6;
  const tierBuckets = (() => {
    if (counts.length < NUM_TIERS) {
      // 用户太少，用固定分档兜底
      return [
        { min: 1, max: 1, label: '1次' }, { min: 2, max: 2, label: '2次' }, { min: 3, max: 5, label: '3-5次' },
        { min: 6, max: 10, label: '6-10次' }, { min: 11, max: 30, label: '11-30次' }, { min: 31, max: 999999, label: '30+次' },
      ];
    }
    const perTier = Math.floor(counts.length / NUM_TIERS);
    const boundaries: number[] = [];
    for (let i = 1; i < NUM_TIERS; i++) {
      let raw = counts[i * perTier];
      if (raw <= 1) raw = i; // 强制分开
      // 取 5 或 10 的倍数：≤100 取 5 的倍数，>100 取 10 的倍数
      const step = raw >= 100 ? 10 : 5;
      boundaries.push(Math.max(i, Math.ceil(raw / step) * step));
    }
    // 去重递进去边界
    const deduped: number[] = [];
    let prev = 0;
    for (const b of boundaries) {
      const v = b > prev ? b : prev + 1;
      deduped.push(v);
      prev = v;
    }
    const tiers = [{ min: 1, max: deduped[0] }];
    for (let i = 1; i < deduped.length; i++) tiers.push({ min: deduped[i - 1] + 1, max: deduped[i] });
    tiers.push({ min: deduped[deduped.length - 1] + 1, max: 999999 });
    return tiers.map((t, i) => {
      const label = i === tiers.length - 1
        ? `${t.min}+次`
        : t.min === t.max
          ? `${t.min}次`
          : `${t.min}-${t.max}次`;
      return { ...t, label };
    });
  })();
  const tiers = tierBuckets.map((b) => ({
    label: b.label,
    count: userTierRaw.filter((u) => u._count._all >= b.min && u._count._all <= b.max).length,
    pct: totalBettors > 0 ? Math.round((userTierRaw.filter((u) => u._count._all >= b.min && u._count._all <= b.max).length / totalBettors) * 100) : 0,
  }));

  const txTotalAmount = txTypeAgg.reduce((s, t) => s + Math.abs(Number(t._sum.amount ?? 0n)), 0);
  const TYPE_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  const TX_LABEL: Record<string, string> = {
    REGISTER_BONUS: '注册赠送', FAUCET: '充值', BET: '投注支出',
    PRIZE: '中奖入账', REFUND: '退款', REDEEM: '兑换码入账',
  };
  const txStats = txTypeAgg
    .filter((t) => t._sum.amount)
    .map((t, i) => ({
      type: t.type, label: TX_LABEL[t.type] ?? t.type,
      amount: Math.abs(Number(t._sum.amount!)),
      pct: txTotalAmount > 0 ? Math.round((Math.abs(Number(t._sum.amount!)) / txTotalAmount) * 100) : 0,
      color: TYPE_COLORS[i % TYPE_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  // 期次趋势（批量）
  const roundIds = recentRounds.map((r) => r.id);
  const [betCountsRaw, userCountsRaw] = await Promise.all([
    prisma.bet.groupBy({ by: ['roundId'], where: { roundId: { in: roundIds } }, _count: { _all: true } }),
    prisma.bet.groupBy({ by: ['roundId', 'userId'], where: { roundId: { in: roundIds } } }),
  ]);
  const betCountMap = new Map(betCountsRaw.map((b) => [b.roundId, b._count._all]));
  const userCountMap = new Map<string, number>();
  for (const u of userCountsRaw) userCountMap.set(u.roundId, (userCountMap.get(u.roundId) ?? 0) + 1);

  const roundRows = recentRounds.map((r) => ({
    roundNo: r.roundNo, status: r.status,
    totalSales: toHOD(r.totalSales), prizePool: toHOD(r.prizePool),
    platformProfit: toHOD(r.platformProfit),
    betCount: betCountMap.get(r.id) ?? 0, userCount: userCountMap.get(r.id) ?? 0,
    returnRate: r.returnRate, drawAt: (r.drawnAt ?? r.drawAt).toISOString(),
  }));

  return ok({
    conversionRate: totalUsers > 0 ? Math.round((totalBettors / totalUsers) * 10000) / 100 : 0,
    repeatRate: totalBettors > 0 ? Math.round((repeatBettors / totalBettors) * 10000) / 100 : 0,
    healthScore,
    platformProfit: platformProfitHOD,
    totalSales: totalSalesHOD,
    activeUsers7d,
    totalPrizesHOD,
    expectedPrizesHOD,
    avgReturnRate: Math.round(salesAgg._avg.returnRate ?? 80),
    tiers,
    txStats,
    roundRows,
  });
}