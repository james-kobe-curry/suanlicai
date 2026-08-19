import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';
import { ok, fail } from '@/lib/api';
import { isPhoneFeaturesEnabled } from '@/lib/settings';
import { rateLimit, getClientIP } from '@/lib/rateLimit';

/** 登录：每 IP 15 分钟内最多 20 次 */
const LOGIN_WINDOW = 15 * 60_000;
const LOGIN_MAX = 20;

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!rateLimit(`login:${ip}`, LOGIN_MAX, LOGIN_WINDOW)) {
    return fail('请求过于频繁，请 15 分钟后再试', 429);
  }

  const body = await req.json().catch(() => null);
  const identifier = String(body?.username ?? '').trim();
  const password = String(body?.password ?? '');

  // 手机号登录：检查功能是否已开启
  if (/^1[3-9]\d{9}$/.test(identifier) && !(await isPhoneFeaturesEnabled())) {
    return fail('手机号登录暂未开放，请使用用户名或邮箱登录');
  }

  // 支持 用户名 / 手机号 / 邮箱 登录
  // 为防止用户名枚举，不管用户是否存在都执行一次 bcrypt 比对（耗时一致）
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { phone: identifier }, { email: identifier }],
    },
  });
  const pwOk = user ? await verifyPassword(password, user.passwordHash) : false;
  // 即使 user 不存在也跑一次 hash 来恒定时间，防止基于响应时间的用户枚举
  if (!user) await verifyPassword(password, '$2a$10$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
  if (!pwOk || !user) {
    return fail('用户名或密码错误', 401);
  }
  if (user.status === 'BANNED') {
    return fail('账户已被封禁，请联系管理员', 403);
  }

  await createSession(user.id, user.username, user.role);
  return ok({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      balance: Number(user.balance),
      bound: !!(user.phone || user.email),
    },
  });
}
