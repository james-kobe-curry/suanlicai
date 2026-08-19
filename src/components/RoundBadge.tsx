const MAP: Record<string, { label: string; cls: string; dot: string }> = {
  OPEN: { label: '投注中', cls: 'bg-oksoft text-ok', dot: 'bg-ok' },
  LOCKED: { label: '已截止', cls: 'bg-warnsoft text-warn', dot: 'bg-warn' },
  DRAWN: { label: '已开奖', cls: 'bg-brandsoft text-brand', dot: 'bg-brand' },
  CANCELED: { label: '已取消', cls: 'bg-errsoft text-err', dot: 'bg-err' },
};

export default function RoundBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, cls: 'bg-raise text-fg3', dot: 'bg-fg3' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
