import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';
import { issueCode, CODE_TTL_SEC } from '@/lib/codeService';
import { isPhoneFeaturesEnabled } from '@/lib/settings';

const PHONE_RE = /^1[3-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 申请绑定验证码（短信/邮件发送） */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const body = await req.json().catch(() => null);
  const type = String(body?.type ?? '') as 'PHONE' | 'EMAIL';
  const value = String(body?.value ?? '').trim();

  if (type !== 'PHONE' && type !== 'EMAIL') return fail('绑定类型无效');

  if (type === 'PHONE') {
    if (!(await isPhoneFeaturesEnabled())) return fail('手机号绑定功能暂未开放');
    if (!PHONE_RE.test(value)) return fail('手机号格式不正确');
    if (user.phone) return fail('已绑定手机号，如需更换请先解绑');
  } else {
    if (!EMAIL_RE.test(value)) return fail('邮箱格式不正确');
    if (user.email) return fail('已绑定邮箱，如需更换请先解绑');
  }

  const taken = await prisma.user.findFirst({
    where: { OR: [{ phone: value }, { email: value }] },
  });
  if (taken) return fail(`该${type === 'PHONE' ? '手机号' : '邮箱'}已被其他账号绑定`);

  try {
    const result = await issueCode(user.id, type, value, 'BIND');
    return ok({
      sent: true,
      ...(result.sentReal ? {} : { demo: true, message: '演示环境：验证码已模拟发送（生产环境将通过真实渠道下发）' }),
      expiresIn: CODE_TTL_SEC,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : '发送失败');
  }
}
