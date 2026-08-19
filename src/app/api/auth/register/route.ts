import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { ok, fail } from '@/lib/api';
import { MICRO } from '@/lib/constants';
import { validatePassword } from '@/lib/password';
import { rateLimit, getClientIP } from '@/lib/rateLimit';

/** 注册：每 IP 每小时最多 5 次 */
const REG_WINDOW = 60 * 60_000;
const REG_MAX = 5;

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!rateLimit(`reg:${ip}`, REG_MAX, REG_WINDOW)) {
    return fail('注册过于频繁，请 1 小时后再试', 429);
  }

  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? '').trim();
  const password = String(body?.password ?? '');

  if (!/^[\w\u4e00-\u9fa5-]{2,20}$/u.test(username)) {
    return fail('用户名需 2-20 位（字母/数字/下划线/中文）');
  }
  const pwErr = validatePassword(password, username);
  if (pwErr) return fail(pwErr);

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return fail('用户名已存在');

  // 所有公开注册均为普通用户；管理员仅能通过种子脚本创建
  const role = 'USER';
  const bonus = BigInt(Number(process.env.REGISTER_BONUS ?? 0)) * MICRO;

  try {
    const user = await prisma.user.create({
      data: { username, passwordHash: await hashPassword(password), role, balance: bonus },
    });
    await prisma.tx.create({
      data: { userId: user.id, type: 'REGISTER_BONUS', amount: bonus, balanceAfter: bonus, note: '注册赠送算力' },
    });
    await createSession(user.id, user.username, user.role);
    return ok({ user: { id: user.id, username: user.username, role: user.role, balance: Number(user.balance) } });
  } catch (e: any) {
    if (e?.code === 'P2002') return fail('用户名已被他人抢先注册');
    throw e;
  }
}
