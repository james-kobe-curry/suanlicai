import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { issueCode, CODE_TTL_SEC } from '@/lib/codeService';
import { rateLimit, getClientIP } from '@/lib/rateLimit';

/** 找回密码验证码：每 IP 每小时最多 5 次 */
const CODE_WINDOW = 60 * 60_000;
const CODE_MAX = 5;

const PHONE_RE = /^1[3-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 找回密码：向已绑定的手机号/邮箱申请验证码 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!rateLimit(`reset-code:${ip}`, CODE_MAX, CODE_WINDOW)) {
    return fail('验证码请求过于频繁，请稍后再试', 429);
  }

  const body = await req.json().catch(() => null);
  const identifier = String(body?.identifier ?? '').trim();

  const isPhone = PHONE_RE.test(identifier);
  const isEmail = EMAIL_RE.test(identifier);
  if (!isPhone && !isEmail) return fail('请输入正确的手机号或邮箱');

  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier }] },
  });
  // 不区分用户是否存在，统一返回相同消息——防止账户枚举
  if (!user) {
    return ok({
      sent: true,
      demo: true,
      message: '如果该账户存在，验证码将发送至对应手机/邮箱',
      expiresIn: CODE_TTL_SEC,
    });
  }

  try {
    const result = await issueCode(user.id, isPhone ? 'PHONE' : 'EMAIL', identifier, 'RESET');
    return ok({
      sent: true,
      ...(result.sentReal ? {} : { demo: true, message: '演示环境：验证码已模拟发送（生产环境将通过邮件下发）' }),
      expiresIn: CODE_TTL_SEC,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : '发送失败');
  }
}
