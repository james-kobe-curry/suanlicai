import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';
import { serRedeem } from '@/lib/serialize';
import { genUniqueRedeemCode } from '@/lib/redeem';
import { MICRO } from '@/lib/constants';

/** 兑换码列表 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const codes = await prisma.redeemCode.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { username: true } } },
  });
  return ok({ codes: codes.map(serRedeem) });
}

/** 批量生成兑换码 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const body = await req.json().catch(() => null);
  const count = Math.floor(Number(body?.count));
  const amountHOD = Number(body?.amountHOD);
  const batch = String(body?.batch ?? '').trim() || '未命名批次';
  const expiresAt = body?.expiresAt ? new Date(String(body.expiresAt)) : null;

  if (!Number.isInteger(count) || count < 1 || count > 500) {
    return fail('生成数量需为 1-500 的整数');
  }
  const amount = BigInt(Math.round(amountHOD * Number(MICRO)));
  if (!Number.isFinite(amountHOD) || amount <= 0n) return fail('面额无效');
  if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date())) {
    return fail('有效期需晚于当前时间');
  }

  const exists = async (c: string) => !!(await prisma.redeemCode.findUnique({ where: { code: c } }));
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(await genUniqueRedeemCode(exists));
  }

  await prisma.redeemCode.createMany({
    data: codes.map((code) => ({
      code,
      amount,
      batch,
      expiresAt,
      createdBy: user.id,
    })),
  });

  return ok({ created: codes.length, batch, amount: Number(amount), codes });
}
