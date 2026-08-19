'use client';

import { fmtNum, fmtDateTime } from '@/lib/fmt';
import RoundBadge from './RoundBadge';

type RoundRow = {
  roundNo: number;
  status: string;
  totalSales: number;
  prizePool: number;
  platformProfit: number;
  betCount: number;
  userCount: number;
  returnRate: number;
  drawAt: string;
};

export default function RoundTrendTable({ rounds }: { rounds: RoundRow[] }) {
  // 找最大值用于柱状条比例
  const maxSales = Math.max(1, ...rounds.map((r) => r.totalSales));
  const maxPrize = Math.max(1, ...rounds.map((r) => r.prizePool));

  if (!rounds.length) {
    return (
      <div className="card p-6">
        <h2 className="section-title">期次趋势</h2>
        <p className="mt-4 text-sm text-fg3">暂无已开奖期次</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="section-title">
        期次趋势
        <span className="ml-2 text-xs font-normal text-fg3">最近 {rounds.length} 期</span>
      </h2>
      <div className="mt-4 overflow-x-auto">
        <table className="tbl min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th>期号</th>
              <th>状态</th>
              <th>销售额</th>
              <th>派奖</th>
              <th>留存</th>
              <th>投注数</th>
              <th>参与人数</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r) => (
              <tr key={r.roundNo}>
                <td className="font-medium text-fg">第 {r.roundNo} 期</td>
                <td><RoundBadge status={r.status} /></td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="mono-num text-xs text-fg">{fmtNum(r.totalSales)}</span>
                    <div className="h-3 flex-1 rounded-full bg-raise">
                      <div
                        className="h-full rounded-full bg-brand/60"
                        style={{ width: `${(r.totalSales / maxSales) * 100}%`, minWidth: r.totalSales > 0 ? 4 : 0 }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="mono-num text-xs text-ok">{fmtNum(r.prizePool)}</span>
                    <div className="h-3 flex-1 rounded-full bg-raise">
                      <div
                        className="h-full rounded-full bg-ok/60"
                        style={{ width: `${(r.prizePool / maxPrize) * 100}%`, minWidth: r.prizePool > 0 ? 4 : 0 }}
                      />
                    </div>
                  </div>
                </td>
                <td className="mono-num text-fg2">{fmtNum(r.platformProfit)}</td>
                <td className="mono-num text-fg">{r.betCount}</td>
                <td className="mono-num text-fg">{r.userCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}