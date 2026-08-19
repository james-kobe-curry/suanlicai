import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';
import { createRound } from '@/lib/engine';
import { serRound } from '@/lib/serialize';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const body = await req.json().catch(() => null);
  try {
    const round = await createRound({
      betCloseAt: new Date(String(body?.betCloseAt ?? '')),
      drawAt: new Date(String(body?.drawAt ?? '')),
      basePriceHOD: body?.basePriceHOD === undefined ? 1 : Number(body.basePriceHOD),
      returnRate: body?.returnRate === undefined ? 80 : Number(body.returnRate),
    });
    return ok({ round: serRound(round) });
  } catch (e) {
    return fail(e instanceof Error ? e.message : '创建失败');
  }
}
