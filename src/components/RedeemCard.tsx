'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fmtHOD } from '@/lib/fmt';

/** 兑换码兑换：输入兑换码领取 HOD 算力 */
export default function RedeemCard({ bound }: { bound: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!bound) {
    return (
      <div className="rounded-lg border border-warn/30 bg-warnsoft p-4 text-xs leading-relaxed text-warn">
        兑换算力需先完成手机号或邮箱绑定（账户安全验证）。请先在上方「安全验证」中绑定后再操作。
      </div>
    );
  }

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setMsg({
          ok: true,
          text: `兑换成功：+${fmtHOD(data.amount)} HOD，当前余额 ${fmtHOD(data.balance)} HOD`,
        });
        setCode('');
        router.refresh();
      } else {
        setMsg({ ok: false, text: data?.error ?? '兑换失败' });
      }
    } catch {
      setMsg({ ok: false, text: '网络请求失败，请重试' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={redeem} className="space-y-3">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="HOD-XXXX-XXXX-XXXX"
          className="mono-num input"
        />
        <button type="submit" disabled={busy || code.length < 10} className="btn-primary shrink-0">
          {busy ? '兑换中…' : '兑换'}
        </button>
      </div>
      <p className="text-xs text-fg3">
        输入活动兑换码即可领取对应 HOD 算力；兑换码一次性使用，具体活动与面额以官方发布为准。
      </p>
      {msg && <p className={`text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>}
    </form>
  );
}
