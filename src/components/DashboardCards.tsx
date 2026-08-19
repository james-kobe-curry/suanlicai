'use client';

import { fmtNum } from '@/lib/fmt';

type Props = {
  conversionRate: number;    // 投注转化率 %
  repeatRate: number;        // 重复投注率 %
  healthScore: number;       // 奖池健康度 %
  platformProfit: number;    // 平台留存 HOD
  totalSales: number;        // 累计销售额 HOD
  activeUsers7d: number;     // 近7天活跃用户
};

function healthColor(v: number) {
  if (v >= 95 && v <= 105) return 'text-ok';
  if (v >= 85 && v <= 115) return 'text-warn';
  return 'text-err';
}

export default function DashboardCards(props: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="card card-hover p-5">
        <p className="eyebrow">投注转化率</p>
        <p className="mono-num mt-2.5 text-2xl font-semibold text-brand">{props.conversionRate}%</p>
        <p className="mt-1 text-xs text-fg3">投注用户 / 总注册用户</p>
      </div>
      <div className="card card-hover p-5">
        <p className="eyebrow">重复投注率</p>
        <p className="mono-num mt-2.5 text-2xl font-semibold text-brand">{props.repeatRate}%</p>
        <p className="mt-1 text-xs text-fg3">≥2次投注用户 / 投注用户</p>
      </div>
      <div className="card card-hover p-5">
        <p className="eyebrow">奖池健康度</p>
        <p className={`mono-num mt-2.5 text-2xl font-semibold ${healthColor(props.healthScore)}`}>
          {props.healthScore}%
        </p>
        <p className="mt-1 text-xs text-fg3">实际派奖 / 预计派奖 · 95%-105% 健康</p>
      </div>
      <div className="card card-hover p-5">
        <p className="eyebrow">平台留存</p>
        <p className="mono-num mt-2.5 text-2xl font-semibold text-ok">{fmtNum(props.platformProfit)}</p>
        <p className="mt-1 text-xs text-fg3">累计 HOD</p>
      </div>
      <div className="card card-hover p-5">
        <p className="eyebrow">累计销售额</p>
        <p className="mono-num mt-2.5 text-2xl font-semibold text-fg">{fmtNum(props.totalSales)}</p>
        <p className="mt-1 text-xs text-fg3">HOD · 全期次合计</p>
      </div>
      <div className="card card-hover p-5">
        <p className="eyebrow">活跃用户（7天）</p>
        <p className="mono-num mt-2.5 text-2xl font-semibold text-fg">{props.activeUsers7d}</p>
        <p className="mt-1 text-xs text-fg3">近 7 天有投注行为的用户</p>
      </div>
    </div>
  );
}