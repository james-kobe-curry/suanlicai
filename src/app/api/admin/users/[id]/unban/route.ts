import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';

/** 解封用户 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSessionUser();
  if (!admin) return fail('未登录', 401);
  if (!isAdmin(admin)) return fail('无管理权限', 403);

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return fail('用户不存在', 404);
  if (target.role === 'ADMIN') return fail('管理员无需解封');
  if (target.id === admin.id) return fail('不能操作自己的账户');

  await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });
  return ok({ success: true });
}
