import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

/** 获取用户流水（支持筛选），由 TxHistorySection 客户端组件调用 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId: user.id };

  if (search) {
    where.note = { contains: search };
  }
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) createdAt.lte = new Date(`${dateTo}T23:59:59.999Z`);
    where.createdAt = createdAt;
  }

  const txs = await prisma.tx.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 2000,
  });

  return ok({
    txs: txs.map((t) => ({
      id: t.id,
      type: t.type,
      amount: String(t.amount),
      balanceAfter: String(t.balanceAfter),
      note: t.note,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}