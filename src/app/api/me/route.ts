import { getSessionUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  return ok({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      balance: Number(user.balance),
      bound: !!(user.phone || user.email),
      platformId: user.platformId,
      boundAt: user.boundAt ? user.boundAt.toISOString() : null,
    },
  });
}
