import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/api';

/** 最近中大奖用户（一等奖~三等奖），用于首页滚动展示 */
export async function GET() {
  const winners = await prisma.bet.findMany({
    where: { status: 'WON', winLevel: { in: [1, 2, 3] } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { username: true } },
      round: { select: { roundNo: true } },
    },
  });

  return ok({
    winners: winners.map((w) => ({
      username: w.user.username,
      roundNo: w.round.roundNo,
      level: w.winLevel,
      prize: Number(w.prize),
    })),
  });
}