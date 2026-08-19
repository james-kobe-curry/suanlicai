'use client';

import { useState, useEffect, useCallback } from 'react';
import { fmtHOD } from '@/lib/fmt';

type Row = {
  userId: string;
  username: string;
  totalStake: string;
  totalPrize: string;
  profit: string;
  betCount: number;
  wonCount: number;
  winRate: number;
};

type Summary = {
  topProfit: string;
  totalPlayers: number;
  totalPrizes: string;
};

const TABS = [
  { key: 'all', label: '总榜' },
  { key: 'month', label: '月榜' },
  { key: 'week', label: '周榜' },
] as const;

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'profit', label: '净收益' },
  { key: 'prize', label: '总中奖' },
  { key: 'stake', label: '总投入' },
  { key: 'bets', label: '投注次数' },
  { key: 'winRate', label: '胜率' },
];

export default function LeaderboardTable() {
  const [period, setPeriod] = useState<string>('all');
  const [sort, setSort] = useState('profit');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async (p: number, s: string, per: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: per, sort: s, page: String(p) });
      const res = await fetch(`/api/leaderboard?${params}`);
      if (!res.ok) { setRows([]); setLoading(false); return; }
      const data = await res.json();
      setRows(data.users || []);
      setSummary(data.summary || null);
      setTotalPages(data.totalPages || 0);
      setPage(data.page || 1);
    } catch { setRows([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(1, sort, period); }, [period, sort, fetchData]);

  function changeSort(key: string) {
    setSort(key);
    setPage(1);
  }
  function changePeriod(key: string) {
    setPeriod(key);
    setPage(1);
    setSort('profit');
  }
  function goPage(p: number) {
    if (p < 1 || p > totalPages) return;
    fetchData(p, sort, period);
  }

  const pageBtns: number[] = [];
  const s = Math.max(1, page - 2);
  const e = Math.min(totalPages, page + 2);
  for (let i = s; i <= e; i++) pageBtns.push(i);

  return (
    <div className="space-y-6">
      {/* 顶部统计卡 */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card card-hover p-5">
            <p className="eyebrow">🏆 榜首净收益</p>
            <p className={`mono-num mt-2.5 text-2xl font-semibold ${BigInt(summary.topProfit) >= 0n ? 'text-ok' : 'text-err'}`}>
              {BigInt(summary.topProfit) >= 0n ? '+' : ''}{fmtHOD(BigInt(summary.topProfit))}
            </p>
            <p className="mt-1 text-xs text-fg3">HOD · 当期段最高</p>
          </div>
          <div className="card card-hover p-5">
            <p className="eyebrow">📊 参与人数</p>
            <p className="mono-num mt-2.5 text-2xl font-semibold text-fg">{summary.totalPlayers}</p>
            <p className="mt-1 text-xs text-fg3">投注用户总数</p>
          </div>
          <div className="card card-hover p-5">
            <p className="eyebrow">💰 总派奖</p>
            <p className="mono-num mt-2.5 text-2xl font-semibold text-ok">{fmtHOD(BigInt(summary.totalPrizes))}</p>
            <p className="mt-1 text-xs text-fg3">HOD · 当期段累计</p>
          </div>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="segmented">
            {TABS.map((t) => (
              <button
                key={t.key}
                data-active={String(period === t.key)}
                onClick={() => changePeriod(t.key)}
                className="!px-4"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-fg3">
            <span>排序：</span>
            <select
              value={sort}
              onChange={(e) => changeSort(e.target.value)}
              className="input h-7 w-24 text-xs"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 表格 */}
        <div className="mt-4 overflow-x-auto">
          <table className="tbl min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="w-14">#</th>
                <th>用户名</th>
                <th>总投入</th>
                <th>总中奖</th>
                <th>净收益</th>
                <th>投注次数</th>
                <th>胜率</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-fg3">加载中…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-fg3">暂无数据</td></tr>
              ) : (
                rows.map((r, i) => {
                  const rank = (page - 1) * 50 + i + 1;
                  const profit = BigInt(r.profit);
                  return (
                    <tr key={r.userId}>
                      <td className="mono-num text-fg3">
                        {rank <= 3 ? (
                          <span className="text-base">{['🥇', '🥈', '🥉'][rank - 1]}</span>
                        ) : rank}
                      </td>
                      <td className="font-medium text-fg">{r.username}</td>
                      <td className="mono-num text-fg2">{fmtHOD(BigInt(r.totalStake))}</td>
                      <td className="mono-num text-ok">{fmtHOD(BigInt(r.totalPrize))}</td>
                      <td className={`mono-num font-semibold ${profit >= 0n ? 'text-ok' : 'text-err'}`}>
                        {profit >= 0n ? '+' : ''}{fmtHOD(BigInt(r.profit))}
                      </td>
                      <td className="mono-num text-fg">{r.betCount}</td>
                      <td className="mono-num text-fg">{r.winRate}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1.5">
            <button onClick={() => goPage(1)} disabled={page <= 1} className="btn-secondary !px-2 !py-1 text-xs">«</button>
            <button onClick={() => goPage(page - 1)} disabled={page <= 1} className="btn-secondary !px-2 !py-1 text-xs">‹</button>
            {pageBtns.map((p) => (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={p === page ? 'btn-primary !px-2.5 !py-1 text-xs' : 'btn-secondary !px-2.5 !py-1 text-xs'}
              >
                {p}
              </button>
            ))}
            <button onClick={() => goPage(page + 1)} disabled={page >= totalPages} className="btn-secondary !px-2 !py-1 text-xs">›</button>
            <button onClick={() => goPage(totalPages)} disabled={page >= totalPages} className="btn-secondary !px-2 !py-1 text-xs">»</button>
          </div>
        )}
      </div>
    </div>
  );
}