'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PanelHeader from './PanelHeader';
import { fmtHOD, fmtDateTime } from '@/lib/fmt';

type RedeemDTO = {
  id: string;
  code: string;
  amount: number;
  batch: string;
  status: string;
  expiresAt: string | null;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  UNUSED: { label: '未使用', cls: 'bg-oksoft text-ok' },
  USED: { label: '已使用', cls: 'bg-brandsoft text-brand' },
  DISABLED: { label: '已禁用', cls: 'bg-errsoft text-err' },
  EXPIRED: { label: '已过期', cls: 'bg-warnsoft text-warn' },
};

export default function RedeemAdminPanel({ codes }: { codes: RedeemDTO[] }) {
  const router = useRouter();
  const [count, setCount] = useState('10');
  const [amountHOD, setAmountHOD] = useState('100');
  const [batch, setBatch] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [generated, setGenerated] = useState<string[]>([]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setGenerated([]);
    const res = await fetch('/api/admin/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: Number(count),
        amountHOD: Number(amountHOD),
        batch,
        expiresAt: expiresAt || null,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setMsg({
        ok: true,
        text: `已生成 ${data.created} 个兑换码（批次：${data.batch}，面额 ${fmtHOD(data.amount)} HOD）`,
      });
      setGenerated(data.codes);
      router.refresh();
    } else {
      setMsg({ ok: false, text: data?.error ?? '生成失败' });
    }
    setBusy(false);
  }

  async function toggle(c: RedeemDTO) {
    const label = c.status === 'DISABLED' ? '启用' : '禁用';
    if (!window.confirm(`确认${label}兑换码 ${c.code}？`)) return;
    const res = await fetch(`/api/admin/redeem/${c.id}/toggle`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    setMsg(res.ok ? { ok: true, text: `${label}成功` } : { ok: false, text: data?.error ?? '操作失败' });
    router.refresh();
  }

  async function copyCode(c: string) {
    try {
      await navigator.clipboard.writeText(c);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      {/* ── 生成兑换码（操作区） ── */}
      <form onSubmit={generate} className="card p-7">
        <PanelHeader
          eyebrow="Create Codes"
          title="生成兑换码"
          desc="兑换码格式 HOD-XXXX-XXXX-XXXX，一次性使用；用户需完成手机/邮箱绑定后方可兑换"
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-fg2">
            生成数量（1-500）
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              required
              className="input mt-1.5"
            />
          </label>
          <label className="text-xs text-fg2">
            面额 HOD / 个
            <input
              type="number"
              min={0.000001}
              step={0.000001}
              value={amountHOD}
              onChange={(e) => setAmountHOD(e.target.value)}
              required
              className="input mt-1.5"
            />
          </label>
          <label className="text-xs text-fg2">
            批次名（可选）
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="如：上线活动第一批"
              className="input mt-1.5"
            />
          </label>
          <label className="text-xs text-fg2">
            有效期至（可选）
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="input mt-1.5"
            />
          </label>
        </div>
        {/* 操作栏 */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <span className="flex-1" />
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? '生成中…' : '批量生成'}
          </button>
        </div>
        {msg && (
          <p className={`mt-3 text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>
        )}
        {generated.length > 0 && (
          <div className="mt-5 rounded-xl border border-line bg-raise p-4">
            <p className="text-xs text-fg3">本次生成的兑换码（点击复制）</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {generated.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => copyCode(c)}
                  title="点击复制"
                  className="mono-num rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-brand transition-colors duration-150 hover:border-brand"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* ── 兑换码列表（数据区） ── */}
      <div className="card overflow-hidden">
        <div className="border-b border-line px-7 py-5">
          <PanelHeader eyebrow="Code List" title="兑换码列表" badge={`${codes.length} 个`} />
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[900px] text-sm">
            <thead>
              <tr>
                <th>兑换码</th>
                <th>面额</th>
                <th>批次</th>
                <th>状态</th>
                <th>有效期至</th>
                <th>使用者 / 时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => {
                const s = STATUS_MAP[c.status] ?? { label: c.status, cls: 'bg-raise text-fg3' };
                return (
                  <tr key={c.id}>
                    <td className="mono-num text-xs text-fg">{c.code}</td>
                    <td className="mono-num text-fg">{fmtHOD(c.amount)}</td>
                    <td className="text-fg2">{c.batch}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="text-xs text-fg3">{c.expiresAt ? fmtDateTime(c.expiresAt) : '永久'}</td>
                    <td className="text-xs text-fg3">
                      {c.usedBy ? `${c.usedBy} · ${c.usedAt ? fmtDateTime(c.usedAt) : ''}` : '—'}
                    </td>
                    <td>
                      {(c.status === 'UNUSED' || c.status === 'DISABLED') && (
                        <button
                          onClick={() => toggle(c)}
                          className={
                            c.status === 'DISABLED'
                              ? 'btn-secondary !px-3 !py-1 text-xs'
                              : 'btn-danger !px-3 !py-1 text-xs'
                          }
                        >
                          {c.status === 'DISABLED' ? '启用' : '禁用'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!codes.length && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-fg3">
                    暂无兑换码
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
