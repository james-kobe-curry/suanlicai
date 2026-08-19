import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fmtHOD } from '@/lib/fmt';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import ChangeUsername from '@/components/ChangeUsername';
import PlatformBindCard from '@/components/PlatformBindCard';
import ContactBindCard from '@/components/ContactBindCard';
import RedeemCard from '@/components/RedeemCard';
import TxHistorySection from '@/components/TxHistorySection';
import BetHistorySection from '@/components/BetHistorySection';
import { isPhoneFeaturesEnabled } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const phoneEnabled = await isPhoneFeaturesEnabled();

  const [txs, bets, wonAgg, betCount] = await Promise.all([
    prisma.tx.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.bet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { round: { select: { roundNo: true, status: true } } },
    }),
    prisma.bet.aggregate({
      where: { userId: user.id, status: 'WON' },
      _sum: { prize: true },
      _count: { _all: true },
    }),
    prisma.bet.count({ where: { userId: user.id } }),
  ]);

  // 序列化给客户端组件
  const txRows = txs.map((t) => ({
    id: t.id,
    type: t.type,
    amount: String(t.amount),
    balanceAfter: String(t.balanceAfter),
    note: t.note,
    createdAt: t.createdAt.toISOString(),
  }));
  const betRows = bets.map((b) => ({
    id: b.id,
    code: b.code,
    tier: b.tier,
    stake: String(b.stake),
    status: b.status,
    winLevel: b.winLevel,
    prize: String(b.prize),
    createdAt: b.createdAt.toISOString(),
    round: b.round,
  }));

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card card-hover p-5">
          <p className="eyebrow">Balance</p>
          <p className="mono-num num-grad mt-2.5 text-2xl font-semibold">{fmtHOD(user.balance)}</p>
          <p className="mt-1 text-xs text-fg3">算力余额 · HOD</p>
        </div>
        <div className="card card-hover p-5">
          <p className="eyebrow">Total Won</p>
          <p className="mono-num mt-2.5 text-2xl font-semibold text-ok">
            +{fmtHOD(wonAgg._sum.prize ?? 0n)}
          </p>
          <p className="mt-1 text-xs text-fg3">累计中奖 · {wonAgg._count._all} 注</p>
        </div>
        <div className="card card-hover p-5">
          <p className="eyebrow">Bets</p>
          <p className="mono-num mt-2.5 text-2xl font-semibold text-fg">{betCount}</p>
          <p className="mt-1 text-xs text-fg3">累计投注 · 注</p>
        </div>
        <div className="card card-hover p-5">
          <p className="eyebrow">Registered</p>
          <p className="mono-num mt-2.5 text-lg font-semibold text-fg2">{user.createdAt.toLocaleDateString('zh-CN')}</p>
          <p className="mt-1 text-xs text-fg3">注册时间</p>
        </div>
      </div>

      {/* 账户安全 + 平台绑定 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="section-title">账户安全</h2>
          <p className="mb-4 mt-1 text-xs text-fg3">
            用户名 <span className="font-medium text-fg">{user.username}</span>
            {user.role === 'ADMIN' && (
              <span className="ml-2 rounded-full bg-brandsoft px-2 py-0.5 text-[11px] text-brand">
                管理员
              </span>
            )}
          </p>
          <div className="mb-5">
            <ChangeUsername
              changesUsed={user.usernameChangesThisMonth}
              changedAt={user.usernameChangedAt?.toISOString() ?? null}
            />
          </div>
          <ChangePasswordForm />
        </div>
        <div className="card p-6">
          <h2 className="section-title">平台账户绑定</h2>
          <p className="mb-4 mt-1 text-xs text-fg3">
            将本站账户与算力平台账户关联，二期接入后资产与收益直接同步平台
          </p>
          <PlatformBindCard
            platformId={user.platformId}
            boundAt={user.boundAt ? user.boundAt.toISOString() : null}
            bound={!!(user.phone || user.email)}
          />
        </div>
      </div>

      {/* 安全验证 */}
      <div className="card p-6">
        <h2 className="section-title">安全验证</h2>
        <p className="mb-4 mt-1 text-xs text-fg3">
          绑定手机号或邮箱以加强账户安全，绑定后可直接使用手机号 / 邮箱登录
        </p>
        <ContactBindCard phone={user.phone} email={user.email} phoneEnabled={phoneEnabled} />
      </div>

      {/* 兑换码 */}
      <div className="card p-6">
        <h2 className="section-title">兑换码</h2>
        <p className="mb-4 mt-1 text-xs text-fg3">
          输入活动兑换码领取 HOD 算力，兑换码一次性使用
        </p>
        <RedeemCard bound={!!(user.phone || user.email)} />
      </div>

      {/* 算力流水 */}
      <TxHistorySection initial={txRows} />

      {/* 投注记录 */}
      <BetHistorySection initial={betRows} />
    </div>
  );
}
