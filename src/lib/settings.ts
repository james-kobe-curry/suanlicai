import { prisma } from './prisma';

const KEY = 'phone_auth_enabled';

/** 手机号功能（绑定/登录）当前是否启用 */
export async function isPhoneFeaturesEnabled(): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  return row?.value === 'true';
}

/** 管理员切换手机号功能开/关 */
export async function togglePhoneFeatures(adminId: string): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  const next = row?.value !== 'true' ? 'true' : 'false';
  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: next, updatedBy: adminId },
    update: { value: next, updatedBy: adminId },
  });
  return next === 'true';
}