import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { ok, fail } from '@/lib/api';
import { validatePassword } from '@/lib/password';
import { verifyAndConsumeCode } from '@/lib/codeService';

const PHONE_RE = /^1[3-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 找回密码：验证码核对通过后重置密码（新密码需满足强度要求） */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const identifier = String(body?.identifier ?? '').trim();
  const code = String(body?.code ?? '').trim();
  const newPassword = String(body?.newPassword ?? '');

  const isPhone = PHONE_RE.test(identifier);
  const isEmail = EMAIL_RE.test(identifier);
  if (!isPhone && !isEmail) return fail('请输入正确的手机号或邮箱');
  if (!/^\d{6}$/.test(code)) return fail('验证码须为 6 位数字');

  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier }] },
  });
  if (!user) return fail('账户不存在');

  const pwErr = validatePassword(newPassword, user.username);
  if (pwErr) return fail(pwErr);

  const valid = await verifyAndConsumeCode(user.id, identifier, 'RESET', code);
  if (!valid) return fail('验证码错误或已过期');

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return ok({ success: true });
}
