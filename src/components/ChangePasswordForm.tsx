'use client';

import { useState } from 'react';
import PasswordMeter from './PasswordMeter';
import { PASSWORD_HINT } from '@/lib/password';

export default function ChangePasswordForm() {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirm) {
      setMsg({ ok: false, text: '两次输入的新密码不一致' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setMsg({ ok: true, text: '密码已更新' });
        setOldPw('');
        setNewPw('');
        setConfirm('');
      } else {
        setMsg({ ok: false, text: data?.error ?? '修改失败' });
      }
    } catch {
      setMsg({ ok: false, text: '网络请求失败，请重试' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="password"
        value={oldPw}
        onChange={(e) => setOldPw(e.target.value)}
        placeholder="当前密码"
        required
        className="input"
      />
      <input
        type="password"
        value={newPw}
        onChange={(e) => setNewPw(e.target.value)}
        placeholder="新密码（8-64 位，至少 3 类字符）"
        required
        className="input"
      />
      <div className="space-y-1.5">
        <PasswordMeter value={newPw} />
        <p className="text-xs text-fg3">{PASSWORD_HINT}</p>
      </div>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="确认新密码"
        required
        className="input"
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? '提交中…' : '修改密码'}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</span>
        )}
      </div>
    </form>
  );
}
