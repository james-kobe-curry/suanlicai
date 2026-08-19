import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, verifyPassword } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

/** 解绑手机号/邮箱（需密码确认，保证账号安全） */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const body = await req.json().catch(() => null);
  const type = String(body?.type ?? '') as 'PHONE' | 'EMAIL';
  const password = String(body?.password ?? '');

  if (type !== 'PHONE' && type !== 'EMAIL') return fail('绑定类型无效');
  if (!(await verifyPassword(password, user.passwordHash))) {
    return fail('密码不正确，无法解绑');
  }
  if (type === 'PHONE' && !user.phone) return fail('尚未绑定手机号');
  if (type === 'EMAIL' && !user.email) return fail('尚未绑定邮箱');

  await prisma.user.update({
    where: { id: user.id },
    data: type === 'PHONE' ? { phone: null } : { email: null },
  });

  return ok({ success: true });
}
