'use client';

type TxTypeStat = { type: string; label: string; amount: number; pct: number; color: string };

const TYPE_COLORS: Record<string, string> = {
  BET: '#ef4444',
  PRIZE: '#22c55e',
  FAUCET: '#6366f1',
  REGISTER_BONUS: '#14b8a6',
  REFUND: '#f59e0b',
  REDEEM: '#8b5cf6',
};

export default function TxTypeBar({ stats }: { stats: TxTypeStat[] }) {
  if (!stats.length) {
    return (
      <div className="card p-6">
        <h2 className="section-title">流水类型分布</h2>
        <p className="mt-4 text-sm text-fg3">暂无数据</p>
      </div>
    );
  }

  const total = stats.reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="card p-6">
      <h2 className="section-title">流水类型分布</h2>
      <p className="mt-1 text-xs text-fg3">各类交易金额占比</p>

      {/* 堆叠条 */}
      <div className="mt-4 h-6 w-full overflow-hidden rounded-full bg-raise flex">
        {stats.map((s) => {
          const w = total > 0 ? (Math.abs(s.amount) / total) * 100 : 0;
          if (w < 1) return null;
          return (
            <div
              key={s.type}
              title={`${s.label}: ${s.pct}%`}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${w}%`, background: s.color }}
            />
          );
        })}
      </div>

      {/* 图例 */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {stats.map((s) => (
          <div key={s.type} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-fg2">{s.label}</span>
            <span className="mono-num text-fg3">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}