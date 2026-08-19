import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { serRound, serBet } from '@/lib/serialize';
import { ok, fail } from '@/lib/api';
import { PRIZE_LEVELS } from '@/lib/constants';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const round = await prisma.round.findUnique({ where: { id } });
  if (!round) return fail('期次不存在', 404);

  const stats = await prisma.bet.groupBy({
    by: ['winLevel'],
    where: { roundId: id, status: 'WON' },
    _count: { _all: true },
    _sum: { prize: true },
  });

  const winners = await prisma.bet.findMany({
    where: { roundId: id, status: 'WON' },
    orderBy: { prize: 'desc' },
    take: 20,
    include: { user: { select: { username: true } } },
  });

  const user = await getSessionUser();
  const myBets = user
    ? await prisma.bet.findMany({
        where: { roundId: id, userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const levelStats = PRIZE_LEVELS.map((L) => {
    const s = stats.find((x) => x.winLevel === L.level);
    return {
      level: L.level,
      name: L.name,
      pct: L.pct,
      desc: L.desc,
      winners: s?._count._all ?? 0,
      paid: Number(s?._sum.prize ?? 0n),
    };
  });

  return ok({
    round: serRound(round),
    levelStats,
    winners: winners.map((w) => ({
      username: w.user.username,
      code: w.code,
      tier: w.tier,
      winLevel: w.winLevel,
      prize: Number(w.prize),
    })),
    myBets: myBets.map(serBet),
  });
}
