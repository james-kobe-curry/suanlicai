import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, verifyPassword } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

const USERNAME_RE = /^[\w\u4e00-\u9fa5-]{2,20}$/u;
const MONTHLY_LIMIT = 2;

/** 修改用户名（每月限 2 次，需密码确认） */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const body = await req.json().catch(() => null);
  const newUsername = String(body?.username ?? '').trim();
  const password = String(body?.password ?? '');

  if (!(await verifyPassword(password, user.passwordHash))) {
    return fail('密码不正确');
  }
  if (!USERNAME_RE.test(newUsername)) return fail('用户名需 2-20 位（字母/数字/下划线/中文）');
  if (newUsername === user.username) return fail('新用户名与当前相同');

  const taken = await prisma.user.findUnique({ where: { username: newUsername } });
  if (taken) return fail('用户名已被他人使用');

  // 月限额重置
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
  const lastChangeMonth = user.usernameChangedAt
    ? `${user.usernameChangedAt.getFullYear()}-${user.usernameChangedAt.getMonth()}`
    : null;
  const isNewMonth = lastChangeMonth !== thisMonth;
  const remaining = isNewMonth ? MONTHLY_LIMIT : MONTHLY_LIMIT - user.usernameChangesThisMonth;
  if (remaining <= 0) return fail('本月修改次数已用完（2 次/月）');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      username: newUsername,
      usernameChangesThisMonth: isNewMonth ? 1 : user.usernameChangesThisMonth + 1,
      usernameChangedAt: now,
    },
  });

  return ok({ success: true, remaining: remaining - 1 });
}