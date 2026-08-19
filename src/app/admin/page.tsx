import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isAdmin } from '@/lib/api';
import { serRound } from '@/lib/serialize';
import { fmtHOD } from '@/lib/fmt';
import AdminPanel from '@/components/AdminPanel';
import PhoneFeatureToggle from '@/components/PhoneFeatureToggle';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!isAdmin(user)) redirect('/');

  const [rounds, userCount, salesAgg, profitAgg, openCount] = await Promise.all([
    prisma.round.findMany({ orderBy: { roundNo: 'desc' }, take: 30 }),
    prisma.user.count(),
    prisma.round.aggregate({ _sum: { totalSales: true } }),
    prisma.round.aggregate({ _sum: { platformProfit: true } }),
    prisma.round.count({ where: { status: { in: ['OPEN', 'LOCKED'] } } }),
  ]);

  const stats = [
    { label: '注册用户', value: String(userCount), eyebrow: 'Users' },
    { label: '累计销售额', value: fmtHOD(salesAgg._sum.totalSales ?? 0n), eyebrow: 'Total Sales' },
    { label: '平台留存', value: fmtHOD(profitAgg._sum.platformProfit ?? 0n), eyebrow: 'Platform Profit' },
    { label: '进行中期次', value: String(openCount), eyebrow: 'Active Rounds' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-brand">Rounds Management</p>
        <h1 className="mt-1 text-xl font-semibold text-fg">期次管理</h1>
      </div>

      {/* 平台概览 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card card-hover p-5">
            <p className="eyebrow">{s.eyebrow}</p>
            <p className="mono-num mt-2.5 text-2xl font-semibold text-fg">{s.value}</p>
            <p className="mt-1 text-xs text-fg3">{s.label}</p>
          </div>
        ))}
      </div>

      <PhoneFeatureToggle />

      <AdminPanel rounds={rounds.map(serRound)} />
    </div>
  );
}
