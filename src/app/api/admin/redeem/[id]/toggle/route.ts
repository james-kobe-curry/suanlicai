import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';

/** 启用/禁用兑换码（已使用的码不可变更） */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const { id } = await params;
  const rec = await prisma.redeemCode.findUnique({ where: { id } });
  if (!rec) return fail('兑换码不存在', 404);
  if (rec.status === 'USED') return fail('已使用的兑换码不可变更');

  const next = rec.status === 'DISABLED' ? 'UNUSED' : 'DISABLED';
  await prisma.redeemCode.update({ where: { id }, data: { status: next } });
  return ok({ success: true, status: next });
}
