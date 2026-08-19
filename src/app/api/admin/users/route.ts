import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';
import { serUserAdmin } from '@/lib/serialize';

const PAGE_SIZE = 30;

/** 用户管理：分页列表 + 搜索 + 投注统计 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) where.username = { contains: search };

  const [users, total, wonAgg] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { _count: { select: { bets: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
    prisma.bet.groupBy({
      by: ['userId'],
      where: { status: 'WON' },
      _sum: { prize: true },
    }),
  ]);

  const wonMap = new Map(wonAgg.map((w) => [w.userId, w._sum.prize ?? 0n]));

  return ok({
    users: users.map((u) => serUserAdmin(u, wonMap.get(u.id) ?? 0n)),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}