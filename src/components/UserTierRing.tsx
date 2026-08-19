'use client';

type Tier = { label: string; count: number; pct: number; color: string };

const TIER_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function UserTierRing({ tiers }: { tiers: Tier[] }) {
  if (!tiers.length) {
    return (
      <div className="card p-6">
        <h2 className="section-title">用户分层</h2>
        <p className="mt-4 text-sm text-fg3">暂无数据</p>
      </div>
    );
  }

  const total = tiers.reduce((s, t) => s + t.count, 0);

  return (
    <div className="card p-6">
      <h2 className="section-title">用户分层</h2>
      <p className="mt-1 text-xs text-fg3">按投注次数分档 · 共 {total} 人</p>

      {/* 横向堆叠条 */}
      <div className="mt-4 h-7 w-full overflow-hidden rounded-full bg-raise flex">
        {tiers.map((t, i) => {
          const w = total > 0 ? (t.count / total) * 100 : 0;
          if (w < 0.5) return null;
          return (
            <div
              key={t.label}
              title={`${t.label}: ${t.count}人 (${t.pct}%)`}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${w}%`, background: TIER_COLORS[i % TIER_COLORS.length] }}
            />
          );
        })}
      </div>

      {/* 每档明细条 */}
      <div className="mt-4 space-y-2">
        {tiers.map((t, i) => {
          const w = total > 0 ? (t.count / total) * 100 : 0;
          return (
            <div key={t.label} className="flex items-center gap-3">
              <span className="w-10 text-xs text-fg3 text-right shrink-0">{t.label}</span>
              <div className="h-5 flex-1 rounded-full bg-raise overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(w, t.count > 0 ? 2 : 0)}%`,
                    background: TIER_COLORS[i % TIER_COLORS.length],
                    minWidth: t.count > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span className="mono-num w-16 text-right text-xs text-fg shrink-0">
                {t.count} <span className="text-fg3">({t.pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}