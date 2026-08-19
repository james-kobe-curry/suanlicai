import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';
import { cancelRound } from '@/lib/engine';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const { id } = await params;
  try {
    const result = await cancelRound(id);
    return ok({ success: true, ...result });
  } catch (e) {
    return fail(e instanceof Error ? e.message : '取消失败');
  }
}
