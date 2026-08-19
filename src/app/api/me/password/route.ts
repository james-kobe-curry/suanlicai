import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, verifyPassword, hashPassword } from '@/lib/auth';
import { ok, fail } from '@/lib/api';
import { validatePassword } from '@/lib/password';

/** 修改密码：校验旧密码后更新（新密码需满足强度要求） */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const body = await req.json().catch(() => null);
  const oldPassword = String(body?.oldPassword ?? '');
  const newPassword = String(body?.newPassword ?? '');

  if (!(await verifyPassword(oldPassword, user.passwordHash))) {
    return fail('旧密码不正确');
  }
  const pwErr = validatePassword(newPassword, user.username);
  if (pwErr) return fail(pwErr);
  if (newPassword === oldPassword) return fail('新密码不能与旧密码相同');

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  return ok({ success: true });
}
