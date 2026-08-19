import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';

/** 封禁用户：禁止登录与投注（已登录会话即刻失效） */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSessionUser();
  if (!admin) return fail('未登录', 401);
  if (!isAdmin(admin)) return fail('无管理权限', 403);

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return fail('用户不存在', 404);
  if (target.role === 'ADMIN') return fail('不能封禁管理员');
  if (target.id === admin.id) return fail('不能操作自己的账户');

  await prisma.user.update({ where: { id }, data: { status: 'BANNED' } });
  return ok({ success: true });
}
