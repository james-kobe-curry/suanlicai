'use client';

import { useState } from 'react';
import { fmtHOD, fmtDateTime } from '@/lib/fmt';

type TxRow = {
  id: string;
  type: string;
  amount: string; // serialized bigint
  balanceAfter: string;
  note: string | null;
  createdAt: string;
};

const TX_LABEL: Record<string, string> = {
  REGISTER_BONUS: '注册赠送',
  FAUCET: '充值',
  BET: '投注支出',
  PRIZE: '中奖入账',
  REFUND: '退款',
  REDEEM: '兑换码入账',
};

export default function TxHistorySection({ initial }: { initial: TxRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [all, setAll] = useState<TxRow[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const display = expanded ? (all.length ? all : initial) : initial.slice(0, 20);

  async function loadAll() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(`/api/me/txs?${params}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      if (data.txs) setAll(data.txs);
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
        <h2 className="section-title">算力流水</h2>
        <button onClick={toggle} className="text-xs text-brand hover:underline">
          {expanded ? '收起' : `查看全部（共 ${initial.length > 20 ? initial.length : '…'} 条）→`}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-muted p-3">
          <label className="text-xs text-fg2">
            搜索备注
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="关键词…"
              className="input mt-1 h-8 w-32 text-xs"
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
          <button onClick={doSearch} disabled={loading} className="btn-secondary h-8 !px-3 text-xs">
            {loading ? '查询中…' : '筛选'}
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="tbl min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th>时间</th>
              <th>类型</th>
              <th>变动</th>
              <th>余额</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {display.map((t) => (
              <tr key={t.id}>
                <td className="text-xs text-fg3">{fmtDateTime(t.createdAt)}</td>
                <td className="text-fg">{TX_LABEL[t.type] ?? t.type}</td>
                <td className={`mono-num ${BigInt(t.amount) >= 0n ? 'text-ok' : 'text-err'}`}>
                  {BigInt(t.amount) >= 0n ? '+' : ''}
                  {fmtHOD(BigInt(t.amount))}
                </td>
                <td className="mono-num text-fg2">{fmtHOD(BigInt(t.balanceAfter))}</td>
                <td className="text-xs text-fg3">{t.note ?? '-'}</td>
              </tr>
            ))}
            {!display.length && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-fg3">暂无流水</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}