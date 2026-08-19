import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

/** 获取用户投注记录（支持筛选），由 BetHistorySection 客户端组件调用 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { searchParams } = new URL(req.url);
  const roundNo = searchParams.get('roundNo') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const status = searchParams.get('status') || undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId: user.id };

  if (roundNo) {
    where.round = { roundNo: Number(roundNo) };
  }
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) createdAt.lte = new Date(`${dateTo}T23:59:59.999Z`);
    where.createdAt = createdAt;
  }
  if (status) {
    where.status = status;
  }

  const bets = await prisma.bet.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 2000,
    include: {
      round: { select: { roundNo: true, status: true } },
    },
  });

  return ok({
    bets: bets.map((b) => ({
      id: b.id,
      code: b.code,
      tier: b.tier,
      stake: String(b.stake),
      status: b.status,
      winLevel: b.winLevel,
      prize: String(b.prize),
      createdAt: b.createdAt.toISOString(),
      round: b.round,
    })),
  });
}