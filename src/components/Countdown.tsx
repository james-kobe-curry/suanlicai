'use client';

import { useEffect, useState } from 'react';

function Seg({ v }: { v: number }) {
  return (
    <span className="mono-num grid h-11 w-11 place-items-center rounded-lg border border-line bg-raise text-xl font-semibold text-brand shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]">
      {String(v).padStart(2, '0')}
    </span>
  );
}

export default function Countdown({ target, label }: { target: string; label?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, new Date(target).getTime() - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="mr-2 text-sm text-fg2">{label}</span>}
      <Seg v={h} />
      <span className="text-lg font-light text-fg3">:</span>
      <Seg v={m} />
      <span className="text-lg font-light text-fg3">:</span>
      <Seg v={s} />
    </div>
  );
}
