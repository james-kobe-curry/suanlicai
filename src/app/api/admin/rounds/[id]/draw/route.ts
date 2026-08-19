import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';
import { settleRound } from '@/lib/engine';

/** 手动开奖：投注中的期次先强制截止，再结算 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const { id } = await params;
  const round = await prisma.round.findUnique({ where: { id } });
  if (!round) return fail('期次不存在', 404);
  if (round.status === 'DRAWN') return fail('该期已开奖');
  if (round.status === 'CANCELED') return fail('该期已取消');

  if (round.status === 'OPEN') {
    await prisma.round.update({ where: { id }, data: { status: 'LOCKED' } });
  }

  const result = await settleRound(id);
  return ok({ success: true, result });
}
