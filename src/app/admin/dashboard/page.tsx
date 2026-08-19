'use client';

import { useEffect, useState } from 'react';
import DashboardCards from '@/components/DashboardCards';
import PrizePoolHealth from '@/components/PrizePoolHealth';
import UserTierRing from '@/components/UserTierRing';
import TxTypeBar from '@/components/TxTypeBar';
import RoundTrendTable from '@/components/RoundTrendTable';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-raise ${className}`} />;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('加载失败'));
  }, []);

  if (error) {
    return <p className="py-20 text-center text-fg3">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-brand">Operations Dashboard</p>
        <h1 className="mt-1 text-xl font-semibold text-fg">运营数据看板</h1>
        <p className="mt-1 text-sm text-fg2">投注转化 · 留存 · 奖池健康度 · 交易分布</p>
      </div>

      {!data ? (
        /* 骨架屏 —— 瞬间渲染 */
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-8 w-full rounded-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            </div>
            <div className="card p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-7 w-full rounded-full" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-5 flex-1 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-6 w-full rounded-full" />
          </div>
          <div className="card p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 flex-1 rounded-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </>
      ) : (
        /* 真实数据 */
        <>
          <DashboardCards
            conversionRate={data.conversionRate}
            repeatRate={data.repeatRate}
            healthScore={data.healthScore}
            platformProfit={data.platformProfit}
            totalSales={data.totalSales}
            activeUsers7d={data.activeUsers7d}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <PrizePoolHealth
              actualPrizes={data.totalPrizesHOD}
              expectedPrizes={data.expectedPrizesHOD}
              returnRate={data.avgReturnRate}
            />
            <UserTierRing tiers={data.tiers} />
          </div>
          <TxTypeBar stats={data.txStats} />
          <RoundTrendTable rounds={data.roundRows} />
        </>
      )}
    </div>
  );
}