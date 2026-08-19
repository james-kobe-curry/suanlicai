import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';
import { isPhoneFeaturesEnabled, togglePhoneFeatures } from '@/lib/settings';

/** 查询手机号功能开关状态 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const enabled = await isPhoneFeaturesEnabled();
  return ok({ phoneAuthEnabled: enabled });
}

/** 切换手机号功能开关 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const enabled = await togglePhoneFeatures(user.id);
  return ok({ phoneAuthEnabled: enabled });
}