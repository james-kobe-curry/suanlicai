import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isBound } from '@/lib/api';
import { placeBets } from '@/lib/engine';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('请先登录', 401);
  if (!isBound(user)) return fail('请先绑定手机号或邮箱（账户安全验证），再进行投注', 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body.roundId !== 'string') return fail('参数错误');

  try {
    const result = await placeBets(user.id, {
      roundId: body.roundId,
      mode: body.mode,
      code: body.code,
      positions: body.positions,
      codes: body.codes,
      tier: Number(body.tier),
    });
    return ok({
      created: result.created,
      cost: Number(result.cost),
      balance: Number(result.balance),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : '投注失败');
  }
}
