'use client';

import { useState } from 'react';
import { fmtHOD, fmtDateTime } from '@/lib/fmt';
import { PRIZE_LEVELS } from '@/lib/constants';
import RoundBadge from './RoundBadge';

type BetRow = {
  id: string;
  code: string;
  tier: number;
  stake: string;
  status: string;
  winLevel: number | null;
  prize: string;
  createdAt: string;
  round: { roundNo: number; status: string } | null;
};

const levelName = (lv: number | null) => PRIZE_LEVELS.find((l) => l.level === lv)?.name ?? '-';

export default function BetHistorySection({ initial }: { initial: BetRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [all, setAll] = useState<BetRow[]>([]);
  const [searchRound, setSearchRound] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const display = expanded ? (all.length ? all : initial) : initial.slice(0, 20);

  async function loadAll() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchRound) params.set('roundNo', searchRound);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/me/bets?${params}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      if (data.bets) setAll(data.bets);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function toggle() {
    if (!expanded) {
      setExpanded(true);
      loadAll();
    } else {
      setExpanded(false);
      setAll([]);
    }
  }

  function doSearch() {
    if (expanded) loadAll();
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">投注记录</h2>
        <button onClick={toggle} className="text-xs text-brand hover:underline">
          {expanded ? '收起' : `查看全部（共 ${initial.length > 20 ? initial.length : '…'} 条）→`}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-muted p-3">
          <label className="text-xs text-fg2">
            期次
            <input
              type="number"
              value={searchRound}
              onChange={(e) => setSearchRound(e.target.value)}
              placeholder="期号…"
              className="input mt-1 h-8 w-24 text-xs"
            />
          </label>
          <label className="text-xs text-fg2">
            起始
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input mt-1 h-8 text-xs"
            />
          </label>
          <label className="text-xs text-fg2">
            截止
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input mt-1 h-8 text-xs"
            />
          </label>
          <label className="text-xs text-fg2">
            状态
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input mt-1 h-8 text-xs"
            >
              <option value="">全部</option>
              <option value="WON">已中奖</option>
              <option value="LOST">未中奖</option>
              <option value="ACTIVE">待开奖</option>
              <option value="REFUNDED">已退款</option>
            </select>
          </label>
          <button onClick={doSearch} disabled={loading} className="btn-secondary h-8 !px-3 text-xs">
            {loading ? '查询中…' : '筛选'}
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="tbl min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th>时间</th>
              <th>期次</th>
              <th>竞猜码</th>
              <th>档位</th>
              <th>投入</th>
              <th>状态</th>
              <th>奖金</th>
            </tr>
          </thead>
          <tbody>
            {display.map((b) => (
              <tr key={b.id}>
                <td className="text-xs text-fg3">{fmtDateTime(b.createdAt)}</td>
                <td className="text-fg">
                  第 {b.round?.roundNo ?? '-'} 期{' '}
                  {b.round ? <RoundBadge status={b.round.status} /> : null}
                </td>
                <td className="mono-num tracking-[0.2em] text-brand">{b.code}</td>
                <td className="text-fg2">{b.tier}x</td>
                <td className="mono-num text-fg">{fmtHOD(BigInt(b.stake))}</td>
                <td className="text-fg">
                  {b.status === 'WON'
                    ? `中奖 · ${levelName(b.winLevel)}`
                    : b.status === 'LOST'
                      ? '未中奖'
                      : b.status === 'REFUNDED'
                        ? '已退款'
                        : '待开奖'}
                </td>
                <td className="mono-num text-ok">
                  {BigInt(b.prize) > 0n ? `+${fmtHOD(BigInt(b.prize))} HOD` : '-'}
                </td>
              </tr>
            ))}
            {!display.length && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-fg3">
                  暂无投注，去首页试试手气
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}