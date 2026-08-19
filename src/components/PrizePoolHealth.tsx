'use client';

import { fmtNum } from '@/lib/fmt';

type Props = {
  actualPrizes: number;     // 实际派奖总额 (HOD)
  expectedPrizes: number;   // 预计派奖总额 = 销售额 × 返奖率 (HOD)
  returnRate: number;       // 平均返奖率 %
};

export default function PrizePoolHealth({ actualPrizes, expectedPrizes, returnRate }: Props) {
  const ratio = expectedPrizes > 0 ? (actualPrizes / expectedPrizes) * 100 : 0;
  const clamped = Math.min(Math.max(ratio, 0), 150); // clamp for display
  const healthy = ratio >= 95 && ratio <= 105;

  return (
    <div className="card p-6">
      <h2 className="section-title">奖池健康度</h2>
      <p className="mt-1 text-xs text-fg3">
        实际派奖 vs 预计派奖（销售额 × {returnRate}%）· 健康区间 95%-105%
      </p>

      {/* 仪表条 */}
      <div className="mt-5">
        <div className="relative h-8 w-full overflow-hidden rounded-full bg-raise">
          {/* 背景色段 */}
          <div className="absolute inset-0 flex">
            <div className="h-full bg-err/20" style={{ width: '85%' }} />
            <div className="h-full bg-ok/20" style={{ width: '10%' }} />
            <div className="h-full bg-warn/20" style={{ width: '5%' }} />
          </div>
          {/* 指示线 */}
          <div
            className="absolute top-0 h-full w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-700"
            style={{ left: `${Math.min(clamped, 99)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-fg3">
          <span>0%</span>
          <span className="text-err/70">偏低</span>
          <span className={`font-semibold ${healthy ? 'text-ok' : 'text-warn'}`}>{ratio.toFixed(1)}%</span>
          <span className="text-ok/70">健康</span>
          <span>偏高</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted px-4 py-3">
          <p className="text-xs text-fg3">实际派奖</p>
          <p className="mono-num mt-1 text-lg font-semibold text-ok">{fmtNum(actualPrizes)} HOD</p>
        </div>
        <div className="rounded-lg bg-muted px-4 py-3">
          <p className="text-xs text-fg3">预计派奖</p>
          <p className="mono-num mt-1 text-lg font-semibold text-fg2">{fmtNum(expectedPrizes)} HOD</p>
        </div>
      </div>
    </div>
  );
}