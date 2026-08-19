'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** 修改用户名（每月 2 次，需密码确认） */
export default function ChangeUsername({
  changesUsed,
  changedAt,
}: {
  changesUsed: number;
  changedAt: string | null;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // 计算本月剩余次数
  const now = new Date();
  const changedMonth = changedAt
    ? `${new Date(changedAt).getFullYear()}-${new Date(changedAt).getMonth()}`
    : null;
  const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
  const effectiveUsed = changedMonth === thisMonth ? changesUsed : 0;
  const remaining = 2 - effectiveUsed;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/me/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newName, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setMsg({ ok: true, text: `用户名已修改，本月剩余 ${data.remaining} 次` });
        setNewName('');
        setPassword('');
        router.refresh();
      } else {
        setMsg({ ok: false, text: data?.error ?? '修改失败' });
      }
    } catch {
      setMsg({ ok: false, text: '网络请求失败，请重试' });
    } finally {
      setBusy(false);
    }
  }

  if (remaining <= 0) {
    return (
      <p className="rounded-lg border border-warn/30 bg-warnsoft p-3 text-xs text-warn">
        本月修改次数已用完（2 次/月），下月 1 日重置
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value.trim())}
          placeholder="新用户名（2-20 位）"
          required
          className="input max-w-56"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="输入密码确认"
          required
          className="input max-w-44"
        />
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? '提交…' : '修改'}
        </button>
      </div>
      <p className="text-xs text-fg3">
        本月剩余 <span className="font-medium text-brand">{remaining}</span> 次修改机会（共 2 次/月）
      </p>
      {msg && <p className={`text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>}
    </form>
  );
}