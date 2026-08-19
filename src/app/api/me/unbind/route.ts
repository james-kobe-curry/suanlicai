import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isBound } from '@/lib/api';

/** 解除平台账户绑定 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isBound(user)) return fail('请先绑定手机号或邮箱（账户安全验证）', 403);
  if (!user.platformId) return fail('尚未绑定平台账户');

  await prisma.user.update({
    where: { id: user.id },
    data: { platformId: null, boundAt: null },
  });
  return ok({ success: true });
}
