import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';
import { verifyAndConsumeCode } from '@/lib/codeService';

/** 校验验证码并完成手机号/邮箱绑定 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const body = await req.json().catch(() => null);
  const type = String(body?.type ?? '') as 'PHONE' | 'EMAIL';
  const value = String(body?.value ?? '').trim();
  const code = String(body?.code ?? '').trim();

  if (type !== 'PHONE' && type !== 'EMAIL') return fail('绑定类型无效');
  if (!/^\d{6}$/.test(code)) return fail('验证码须为 6 位数字');

  // 防重复绑定
  const taken = await prisma.user.findFirst({
    where: { OR: [{ phone: value }, { email: value }] },
  });
  if (taken && taken.id !== user.id) {
    return fail(`该${type === 'PHONE' ? '手机号' : '邮箱'}已被其他账号绑定`);
  }

  const valid = await verifyAndConsumeCode(user.id, value, 'BIND', code);
  if (!valid) return fail('验证码错误或已过期');

  await prisma.user.update({
    where: { id: user.id },
    data: type === 'PHONE' ? { phone: value } : { email: value },
  });

  return ok({ success: true, type, value });
}
