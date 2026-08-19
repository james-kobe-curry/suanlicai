'use client';

import { useState, useEffect } from 'react';
import { fmtHOD } from '@/lib/fmt';
import { PRIZE_LEVELS } from '@/lib/constants';

type Winner = {
  id: string;
  username: string;
  code: string;
  tier: number;
  winLevel: number | null;
  prize: string;
};

const levelName = (lv: number | null) => PRIZE_LEVELS.find((l) => l.level === lv)?.name ?? '-';

export default function RoundAllWinners({ roundId, initialTotal }: { roundId: string; initialTotal: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);

  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function load(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (level) params.set('level', level);
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(p));
      const res = await fetch(`/api/rounds/${roundId}/winners?${params}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      if (data.winners) {
        setWinners(data.winners);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    if (open) load(1);
  }, [open, level, search]); // eslint-disable-line react-hooks/exhaustive-deps

  if (initialTotal === 0) return null;

  if (!open) {
    return (
      <div className="card p-6">
        <button onClick={() => setOpen(true)} className="text-sm text-brand hover:underline">
          查看全部中奖名单（共 {initialTotal} 注）→
        </button>
      </div>
    );
  }

  const pageBtns: number[] = [];
  const s = Math.max(1, page - 2);
  const e = Math.min(totalPages, page + 2);
  for (let i = s; i <= e; i++) pageBtns.push(i);

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">全部中奖名单</h2>
        <button onClick={() => setOpen(false)} className="text-xs text-fg3 hover:text-fg">
          收起 ↑
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-muted p-3">
        <label className="text-xs text-fg2">
          奖级
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="input mt-1 h-8 text-xs">
            <option value="">全部</option>
            {PRIZE_LEVELS.map((L) => (
              <option key={L.level} value={L.level}>{L.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-fg2">
          用户名/竞猜码
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="输入关键词…"
            className="input mt-1 h-8 w-40 text-xs"
          />
        </label>
        <button onClick={() => load(1)} disabled={loading} className="btn-secondary h-8 !px-3 text-xs">
          筛选
        </button>
        <span className="text-xs text-fg3">
          第 {page}/{totalPages || 1} 页
        </span>
      </div>

      {/* 表格 */}
      <div className="mt-3 overflow-x-auto">
        <table className="tbl min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th>用户</th>
              <th>竞猜码</th>
              <th>档位</th>
              <th>奖级</th>
              <th>奖金</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center text-fg3">加载中…</td></tr>
            ) : winners.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-fg3">暂无匹配记录</td></tr>
            ) : (
              winners.map((w) => (
                <tr key={w.id}>
                  <td className="font-medium text-fg">{w.username}</td>
                  <td className="mono-num tracking-[0.2em] text-brand">{w.code}</td>
                  <td className="text-fg2">{w.tier}x</td>
                  <td className="text-fg">{levelName(w.winLevel)}</td>
                  <td className="mono-num text-ok">+{fmtHOD(BigInt(w.prize))} HOD</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <button onClick={() => load(1)} disabled={page <= 1} className="btn-secondary !px-2 !py-1 text-xs">«</button>
          <button onClick={() => load(page - 1)} disabled={page <= 1} className="btn-secondary !px-2 !py-1 text-xs">‹</button>
          {pageBtns.map((p) => (
            <button
              key={p}
              onClick={() => load(p)}
              className={p === page ? 'btn-primary !px-2.5 !py-1 text-xs' : 'btn-secondary !px-2.5 !py-1 text-xs'}
            >
              {p}
            </button>
          ))}
          <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="btn-secondary !px-2 !py-1 text-xs">›</button>
          <button onClick={() => load(totalPages)} disabled={page >= totalPages} className="btn-secondary !px-2 !py-1 text-xs">»</button>
        </div>
      )}
    </div>
  );
}