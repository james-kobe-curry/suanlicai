'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fmtDateTime } from '@/lib/fmt';

/** 平台账户绑定：二期接入真实平台授权，目前为手动绑定 */
export default function PlatformBindCard({
  platformId,
  boundAt,
  bound,
}: {
  platformId: string | null;
  boundAt: string | null;
  bound: boolean;
}) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!bound) {
    return (
      <div className="rounded-lg border border-warn/30 bg-warnsoft p-4 text-xs leading-relaxed text-warn">
        绑定平台账户前，需先完成手机号或邮箱绑定（账户安全验证）。请先在上方「安全验证」中绑定后再操作。
      </div>
    );
  }

  async function bind(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/me/bind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId: input }),
    });
    const data = await res.json().catch(() => null);
    setMsg(res.ok ? { ok: true, text: '绑定成功' } : { ok: false, text: data?.error ?? '绑定失败' });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function unbind() {
    if (!window.confirm('确认解除平台账户绑定？')) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/me/unbind', { method: 'POST' });
    const data = await res.json().catch(() => null);
    setMsg(res.ok ? { ok: true, text: '已解绑' } : { ok: false, text: data?.error ?? '解绑失败' });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  if (platformId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-raise px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <div className="text-sm">
            <p className="font-medium text-fg">
              已绑定平台账户 <span className="mono-num text-brand">{platformId}</span>
            </p>
            <p className="text-xs text-fg3">
              绑定时间 {boundAt ? fmtDateTime(boundAt) : '-'} · 资产将随平台账户同步（二期接入）
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={unbind} disabled={busy} className="btn-danger !py-1.5 text-xs">
            解除绑定
          </button>
          {msg && (
            <span className={`text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={bind} className="space-y-3">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="平台账户 ID（如 platform_2026）"
          required
          className="input"
        />
        <button type="submit" disabled={busy} className="btn-primary shrink-0">
          {busy ? '绑定中…' : '绑定'}
        </button>
      </div>
      <p className="text-xs text-fg3">
        正式接入算力平台后，此步骤将通过平台账户授权自动完成，资产与收益直接关联平台账户。
      </p>
      {msg && <p className={`text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>}
    </form>
  );
}
