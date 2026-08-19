'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoundBadge from './RoundBadge';
import DigitBall from './DigitBall';
import PanelHeader from './PanelHeader';
import { fmtHOD, fmtDateTime } from '@/lib/fmt';

type RoundDTO = {
  id: string;
  roundNo: number;
  status: string;
  basePrice: number;
  returnRate: number;
  betCloseAt: string;
  drawAt: string;
  totalSales: number;
  prizePool: number;
  rolloverFrom: number;
  rolloverTo: number;
  platformProfit: number;
  winningCode: string | null;
  drawnAt: string | null;
};

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminPanel({ rounds }: { rounds: RoundDTO[] }) {
  const router = useRouter();
  const [drawAt, setDrawAt] = useState('');
  const [betCloseAt, setBetCloseAt] = useState('');
  const [returnRate, setReturnRate] = useState('80');
  const [basePrice, setBasePrice] = useState('1');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function fillDefaults() {
    const draw = new Date(Date.now() + 60 * 60 * 1000);
    const close = new Date(draw.getTime() - 5 * 60 * 1000);
    setDrawAt(toLocalInput(draw));
    setBetCloseAt(toLocalInput(close));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betCloseAt,
          drawAt,
          returnRate: Number(returnRate),
          basePriceHOD: Number(basePrice),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setMsg({ ok: true, text: `已发布第 ${data.round.roundNo} 期（开奖码已生成，公示哈希承诺）` });
        fillDefaults();
      } else {
        setMsg({ ok: false, text: data?.error ?? '发布失败' });
      }
      router.refresh();
    } catch {
      setMsg({ ok: false, text: '网络请求失败，请重试' });
    } finally {
      setBusy(false);
    }
  }

  async function act(r: RoundDTO, action: 'draw' | 'cancel') {
    const label = action === 'draw' ? '立即开奖' : '取消期次';
    const extra = action === 'cancel' ? '所有投注将全额退款。' : '开奖后不可撤销。';
    if (!window.confirm(`确认对第 ${r.roundNo} 期执行「${label}」？${extra}`)) return;
    try {
      const res = await fetch(`/api/admin/rounds/${r.id}/${action}`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      setMsg(res.ok ? { ok: true, text: `${label}完成` } : { ok: false, text: data?.error ?? '操作失败' });
      router.refresh();
    } catch {
      setMsg({ ok: false, text: '网络请求失败，请重试' });
    }
  }

  return (
    <div className="space-y-6">
      {/* ── 发布活动期次（操作区） ── */}
      <form onSubmit={create} className="card p-7">
        <PanelHeader
          eyebrow="Create Round"
          title="发布活动期次"
          desc="开奖码在期次发布时即生成，公开前仅公示 sha256(开奖码|盐) 承诺，开奖后公布原文"
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-fg2">
            投注截止
            <input
              type="datetime-local"
              value={betCloseAt}
              onChange={(e) => setBetCloseAt(e.target.value)}
              required
              className="input mt-1.5"
            />
          </label>
          <label className="text-xs text-fg2">
            开奖时间
            <input
              type="datetime-local"
              value={drawAt}
              onChange={(e) => setDrawAt(e.target.value)}
              required
              className="input mt-1.5"
            />
          </label>
          <label className="text-xs text-fg2">
            返奖率 %
            <input
              type="number"
              min={1}
              max={100}
              value={returnRate}
              onChange={(e) => setReturnRate(e.target.value)}
              required
              className="input mt-1.5"
            />
          </label>
          <label className="text-xs text-fg2">
            每注基础价 HOD
            <input
              type="number"
              min={0.000001}
              step={0.000001}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              className="input mt-1.5"
            />
          </label>
        </div>
        {/* 操作栏 */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button type="button" onClick={fillDefaults} className="btn-secondary">
            一键填入默认（1 小时后开奖）
          </button>
          <span className="flex-1" />
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? '发布中…' : '发布期次'}
          </button>
        </div>
        {msg && (
          <p className={`mt-3 text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>
        )}
      </form>

      {/* ── 期次列表（数据区） ── */}
      <div className="card overflow-hidden">
        <div className="border-b border-line px-7 py-5">
          <PanelHeader eyebrow="Round List" title="期次列表" badge={`${rounds.length} 期`} />
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[900px] text-sm">
            <thead>
              <tr>
                <th>期号</th>
                <th>状态</th>
                <th>截止 / 开奖</th>
                <th>销售额</th>
                <th>派奖 / 留存</th>
                <th>开奖码</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-fg">第 {r.roundNo} 期</td>
                  <td>
                    <RoundBadge status={r.status} />
                  </td>
                  <td className="text-xs text-fg2">
                    {fmtDateTime(r.betCloseAt)}
                    <br />
                    {fmtDateTime(r.drawAt)}
                  </td>
                  <td className="mono-num text-fg">{fmtHOD(r.totalSales)}</td>
                  <td className="mono-num text-xs text-fg2">
                    {fmtHOD(r.prizePool)} / {fmtHOD(r.platformProfit)}
                  </td>
                  <td>
                    {r.winningCode ? (
                      <div className="flex gap-1">
                        {r.winningCode.split('').map((d, i) => (
                          <DigitBall key={i} d={d} size="sm" />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-fg3">待开奖</span>
                    )}
                  </td>
                  <td>
                    {(r.status === 'OPEN' || r.status === 'LOCKED') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => act(r, 'draw')}
                          className="btn-primary !px-3 !py-1.5 text-xs"
                        >
                          立即开奖
                        </button>
                        <button onClick={() => act(r, 'cancel')} className="btn-danger !px-3 !py-1.5 text-xs">
                          取消
                        </button>
                      </div>
                    )}
                    {r.status === 'DRAWN' && (
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/winners/${r.id}`}
                          className="btn-primary !px-3 !py-1 text-xs"
                        >
                          查看中奖
                        </Link>
                        <a href={`/api/admin/rounds/${r.id}/winners/export`} className="btn-secondary !px-3 !py-1 text-xs">
                          导出CSV
                        </a>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!rounds.length && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-fg3">
                    暂无期次，请先发布
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
