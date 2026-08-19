import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isBound } from '@/lib/api';

/**
 * 绑定平台账户（演示环境为模拟绑定）：
 * 二期接入真实算力平台后，此处改为调用平台账户授权接口，
 * 用平台返回的 userId 写入 platformId 字段即可，业务层无需改动。
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isBound(user)) return fail('请先绑定手机号或邮箱（账户安全验证）', 403);
  if (user.platformId) return fail('已绑定平台账户，如需更换请先解绑');

  const body = await req.json().catch(() => null);
  const platformId = String(body?.platformId ?? '').trim();
  if (!/^[A-Za-z0-9_-]{4,32}$/.test(platformId)) {
    return fail('平台账户 ID 需为 4-32 位字母/数字/下划线/连字符');
  }

  const taken = await prisma.user.findUnique({ where: { platformId } });
  if (taken) return fail('该平台账户已被其他账号绑定');

  await prisma.user.update({
    where: { id: user.id },
    data: { platformId, boundAt: new Date() },
  });
  return ok({ platformId, boundAt: new Date().toISOString() });
}
