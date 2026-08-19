import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';

const PAGE_SIZE = 50;

function dateRange(period: string): { gte?: Date; lte?: Date } {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return { gte: d };
  }
  if (period === 'month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return { gte: d };
  }
  return {};
}

/** 排行榜数据 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'all';
  const sort = searchParams.get('sort') || 'profit';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const range = dateRange(period);

  try {
    // 1. 获取所有投注过的用户聚合数据
    const betsWhere = range.gte ? { createdAt: range } : {};
    const allBets = await prisma.bet.groupBy({
      by: ['userId'],
      where: betsWhere,
      _count: { _all: true },
      _sum: { stake: true },
    });

    const wonBets = await prisma.bet.groupBy({
      by: ['userId'],
      where: { ...betsWhere, status: 'WON' },
      _count: { _all: true },
      _sum: { prize: true },
    });

    const userIds = allBets.map((b) => b.userId);
    if (!userIds.length) return ok({ users: [], total: 0, page: 1, totalPages: 0 });

    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, status: 'ACTIVE' },
      select: { id: true, username: true, balance: true, createdAt: true },
    });

    // 2. 构建排行榜
    const wonMap = new Map(wonBets.map((w) => [w.userId, w]));
    type RowType = {
      userId: string; username: string; totalStake: string; totalPrize: string;
      profit: string; betCount: number; wonCount: number; winRate: number;
    };
    const rows: RowType[] = [];
    for (const b of allBets) {
      const u = users.find((u) => u.id === b.userId);
      if (!u) continue;
      const w = wonMap.get(b.userId);
      const totalStake = b._sum.stake ?? 0n;
      const totalPrize = w?._sum.prize ?? 0n;
      const wonCount = w?._count._all ?? 0;
      const profit = totalPrize - totalStake;
      const winRate = b._count._all > 0 ? wonCount / b._count._all : 0;
      rows.push({
        userId: u.id,
        username: u.username,
        totalStake: String(totalStake),
        totalPrize: String(totalPrize),
        profit: String(profit),
        betCount: b._count._all,
        wonCount,
        winRate: Math.round(winRate * 10000) / 100,
      });
    }

    // 3. 排序
    rows.sort((a, b) => {
      switch (sort) {
        case 'stake': return Number(BigInt(b.totalStake) - BigInt(a.totalStake));
        case 'prize': return Number(BigInt(b.totalPrize) - BigInt(a.totalPrize));
        case 'bets': return b.betCount - a.betCount;
        case 'winRate': return b.winRate - a.winRate;
        default: return Number(BigInt(b.profit) - BigInt(a.profit)); // profit
      }
    });

    const total = rows.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // 4. 汇总统计
    const summary = {
      topProfit: rows.length > 0 ? rows[0].profit : '0',
      totalPlayers: rows.length,
      totalPrizes: String(rows.reduce((s, r) => s + BigInt(r.totalPrize), 0n)),
    };

    return ok({ users: paged, summary, total, page, totalPages });
  } catch (e) {
    return fail('查询失败', 500);
  }
}