'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fmtHOD, fmtDateTime } from '@/lib/fmt';
import { PRIZE_LEVELS } from '@/lib/constants';
import DigitBall from '@/components/DigitBall';

type Winner = {
  id: string;
  username: string;
  code: string;
  tier: number;
  winLevel: number | null;
  prize: string;
};

type RoundInfo = { roundNo: number; winningCode: string | null; drawnAt: string };

const levelName = (lv: number | null) => PRIZE_LEVELS.find((l) => l.level === lv)?.name ?? '-';

export default function AdminWinnersPage() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const fetchData = useCallback(
    async (p: number) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (level) params.set('level', level);
        if (search.trim()) params.set('search', search.trim());
        params.set('page', String(p));
        const res = await fetch(`/api/rounds/${id}/winners?${params}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? '加载失败'); return; }
        setRound(data.round);
        setWinners(data.winners);
        setTotal(data.total);
        setPage(data.page);
      } catch {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    },
    [id, level, search],
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const totalPages = Math.ceil(total / pageSize);

  function goPage(p: number) {
    if (p < 1 || p > totalPages) return;
    fetchData(p);
  }

  function doSearch() {
    fetchData(1);
  }

  // 可访问的页码按钮
  const pageBtns: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pageBtns.push(i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-brand">
            {round ? `Round ${round.roundNo} · Winners` : 'Loading…'}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-fg">
            {round ? `第 ${round.roundNo} 期 · 中奖名单` : '加载中…'}
          </h1>
        </div>
        <div className="flex gap-2">
          {id && (
            <a
              href={`/api/admin/rounds/${id}/winners/export`}
              className="btn-secondary !px-3 !py-1.5 text-xs"
            >
              导出 CSV
            </a>
          )}
          <Link href="/admin" className="btn-secondary !px-3 !py-1.5 text-xs">
            返回管理
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-err/30 bg-err/10 px-4 py-3 text-sm text-err">
          {error}
        </div>
      )}

      {/* 开奖码 */}
      {round?.winningCode && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-fg3">开奖码：</span>
            <div className="flex gap-1">
              {round.winningCode.split('').map((d, i) => (
                <DigitBall key={i} d={d} size="sm" accent />
              ))}
            </div>
            <span className="text-xs text-fg3">
              开奖时间：{fmtDateTime(round.drawnAt)}
            </span>
          </div>
        </div>
      )}

      {/* 中奖明细 */}
      <div className="card p-6">
        <h2 className="section-title">
          中奖明细
          <span className="ml-2 text-xs font-normal text-fg3">共 {total} 注</span>
        </h2>

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
          <button onClick={doSearch} disabled={loading} className="btn-secondary h-8 !px-3 text-xs">
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
                <tr><td colSpan={5} className="py-10 text-center text-fg3">暂无中奖记录</td></tr>
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
            <button onClick={() => goPage(1)} disabled={page <= 1} className="btn-secondary !px-2 !py-1 text-xs">
              «
            </button>
            <button onClick={() => goPage(page - 1)} disabled={page <= 1} className="btn-secondary !px-2 !py-1 text-xs">
              ‹
            </button>
            {pageBtns.map((p) => (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={p === page ? 'btn-primary !px-2.5 !py-1 text-xs' : 'btn-secondary !px-2.5 !py-1 text-xs'}
              >
                {p}
              </button>
            ))}
            <button onClick={() => goPage(page + 1)} disabled={page >= totalPages} className="btn-secondary !px-2 !py-1 text-xs">
              ›
            </button>
            <button onClick={() => goPage(totalPages)} disabled={page >= totalPages} className="btn-secondary !px-2 !py-1 text-xs">
              »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}