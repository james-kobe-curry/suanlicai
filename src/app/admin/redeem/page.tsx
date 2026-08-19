import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isAdmin } from '@/lib/api';
import { serRedeem } from '@/lib/serialize';
import RedeemAdminPanel from '@/components/RedeemAdminPanel';

export const dynamic = 'force-dynamic';

export default async function AdminRedeemPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!isAdmin(user)) redirect('/');

  const codes = await prisma.redeemCode.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { username: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-brand">Redeem Management</p>
        <h1 className="mt-1 text-xl font-semibold text-fg">兑换码管理</h1>
      </div>
      <RedeemAdminPanel codes={codes.map(serRedeem)} />
    </div>
  );
}
