import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isBound } from '@/lib/api';
import { normalizeRedeemCode, isValidRedeemCode } from '@/lib/redeem';

/** 兑换码兑换：领取 HOD 算力（需完成手机/邮箱绑定） */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isBound(user)) return fail('请先绑定手机号或邮箱（账户安全验证）', 403);

  const body = await req.json().catch(() => null);
  const code = normalizeRedeemCode(String(body?.code ?? ''));
  if (!isValidRedeemCode(code)) return fail('兑换码格式不正确');

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rec = await tx.redeemCode.findUnique({ where: { code } });
      if (!rec) throw new Error('兑换码无效');
      if (rec.status === 'DISABLED') throw new Error('兑换码已被禁用');
      if (rec.status === 'USED') throw new Error('兑换码已被使用');
      if (rec.expiresAt && rec.expiresAt < new Date()) throw new Error('兑换码已过期');

      const claimed = await tx.redeemCode.updateMany({
        where: { id: rec.id, status: 'UNUSED' },
        data: { status: 'USED', usedBy: user.id, usedAt: new Date() },
      });
      if (claimed.count === 0) throw new Error('兑换码已被使用');

      // 事务内读最新余额，避免并发丢失更新
      const u = await tx.user.findUnique({ where: { id: user.id } });
      if (!u) throw new Error('用户不存在');
      const balanceAfter = u.balance + rec.amount;
      await tx.user.update({ where: { id: user.id }, data: { balance: balanceAfter } });
      await tx.tx.create({
        data: {
          userId: user.id,
          type: 'REDEEM',
          amount: rec.amount,
          balanceAfter,
          refId: rec.id,
          note: `兑换码入账（${rec.batch}）`,
        },
      });
      return { amount: rec.amount, balance: balanceAfter };
    });

    return ok({
      success: true,
      amount: Number(result.amount),
      balance: Number(result.balance),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : '兑换失败');
  }
}
