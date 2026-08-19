'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fmtHOD } from '@/lib/fmt';

type Winner = { username: string; roundNo: number; level: number; prize: number };

const LV: Record<number, { label: string; cls: string }> = {
  1: { label: '🏆 一等奖', cls: 'ticker-gold' },
  2: { label: '🥈 二等奖', cls: 'ticker-silver' },
  3: { label: '🥉 三等奖', cls: 'ticker-bronze' },
};

export default function WinnerTicker() {
  const [list, setList] = useState<Winner[]>([]);

  useEffect(() => {
    fetch('/api/winners/recent')
      .then(r => r.json())
      .then(d => { if (d.winners?.length) setList(d.winners); })
      .catch(() => {});
  }, []);

  if (!list.length) return null;

  // 去重每人每期 + 按奖金从高到低排序
  const seen = new Set<string>();
  const items = list
    .filter(w => {
      const k = `${w.username}-${w.roundNo}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => b.prize - a.prize)
    .slice(0, 30);

  return (
    <div className="card relative overflow-hidden py-2.5">
      <div className="flex items-center gap-3">
        <span className="shrink-0 rounded-full bg-brandsoft px-3 py-1 text-xs font-medium text-brand">
          中奖播报
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-marquee flex w-max gap-10">
            {[...items, ...items].map((w, i) => {
              const info = LV[w.level] ?? { label: `${w.level}等奖`, cls: '' };
              return (
                <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm">
                  <span className="font-medium text-fg">{w.username}</span>
                  <span className="text-xs text-fg3">第{w.roundNo}期</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${info.cls}`}>
                    {info.label}
                  </span>
                  <span className="mono-num font-semibold text-ok">+{fmtHOD(w.prize)} HOD</span>
                  <span className="text-fg3 mx-2">·</span>
                </span>
              );
            })}
          </div>
        </div>
        <Link href="/rounds" className="shrink-0 text-xs text-brand hover:underline">
          查看全部 →
        </Link>
      </div>
      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 80s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        :global(.ticker-gold) {
          background: linear-gradient(135deg, #f59e0b22, #fbbf2422);
          color: #f59e0b;
          border: 1px solid #f59e0b44;
          text-shadow: 0 0 8px #f59e0b44;
        }
        :global(.ticker-silver) {
          background: linear-gradient(135deg, #94a3b822, #cbd5e122);
          color: #94a3b8;
          border: 1px solid #94a3b844;
        }
        :global(.ticker-bronze) {
          background: linear-gradient(135deg, #d9770622, #fbbf2422);
          color: #d97706;
          border: 1px solid #d9770644;
        }
      `}</style>
    </div>
  );
}