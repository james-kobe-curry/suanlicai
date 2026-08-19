'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TIERS, MAX_COMBOS, MAX_RANDOM } from '@/lib/constants';
import { fmtHOD, fmtDateTime } from '@/lib/fmt';
import TechCorners from './TechCorners';

type RoundDTO = {
  id: string;
  roundNo: number;
  basePrice: number;
  returnRate: number;
  betCloseAt: string;
  drawAt: string;
  totalSales: number;
  rolloverFrom: number;
};

type Me = { username: string; balance: number; bound: boolean } | null | 'loading';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const MODE_LABEL = { single: '单式选号', multi: '复式投注', random: '机选' } as const;

const selectCls =
  'rounded-lg border border-line bg-raise px-3 py-2 text-sm text-fg outline-none transition-all duration-150 focus:border-brand';

export default function BettingPanel({ rounds }: { rounds: RoundDTO[] }) {
  const router = useRouter();
  const [roundId, setRoundId] = useState(rounds[0]?.id ?? '');
  const [mode, setMode] = useState<'single' | 'multi' | 'random'>('single');
  const [single, setSingle] = useState<string[]>(['0', '0', '0', '0', '0', '0']);
  const [multi, setMulti] = useState<string[][]>(() => Array.from({ length: 6 }, () => []));
  const [randCount, setRandCount] = useState(1);
  const [randCodes, setRandCodes] = useState<string[]>([]);
  const [tier, setTier] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [me, setMe] = useState<Me>('loading');

  const round = rounds.find((r) => r.id === roundId);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d ? d.user : null))
      .catch(() => setMe(null));
  }, []);

  // 机选模式：切换到此模式或改变注数时自动生成随机竞猜码
  useEffect(() => {
    if (mode === 'random') regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, randCount]);

  function regenerate() {
    const codes = Array.from({ length: randCount }, () =>
      Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('')
    );
    setRandCodes(codes);
  }

  function toggleMulti(pos: number, d: string) {
    setMulti((prev) => {
      const next = prev.map((s) => [...s]);
      const idx = next[pos].indexOf(d);
      if (idx >= 0) next[pos].splice(idx, 1);
      else next[pos].push(d);
      return next;
    });
  }

  const comboCount = useMemo(() => {
    if (mode === 'single') return 1;
    if (mode === 'random') return randCodes.length;
    return multi.reduce((acc, s) => acc * s.length, 1);
  }, [mode, multi, randCodes]);

  const invalid = useMemo(() => {
    if (mode === 'multi' && multi.some((s) => !s.length)) return '复式每个位置至少选择 1 个数字';
    if (mode === 'multi' && comboCount > MAX_COMBOS) return `复式注数超过上限（${MAX_COMBOS} 注）`;
    if (mode === 'random' && !randCodes.length) return '请先生成机选号码';
    return null;
  }, [mode, multi, comboCount, randCodes]);

  const total = round ? comboCount * round.basePrice * tier : 0;
  const balance = me && me !== 'loading' ? me.balance : 0;
  const insufficient = me !== 'loading' && me !== null && total > balance;

  async function submit() {
    if (!round || invalid || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = { roundId: round.id, mode, tier };
      if (mode === 'single') body.code = single.join('');
      if (mode === 'multi') body.positions = multi;
      if (mode === 'random') body.codes = randCodes;
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ ok: false, text: data?.error ?? '投注失败，请重试' });
      } else {
        setMsg({
          ok: true,
          text: `投注成功：${data.created} 注，共投入 ${fmtHOD(data.cost)} HOD，余额 ${fmtHOD(data.balance)} HOD`,
        });
        setMe((m) => (m && m !== 'loading' ? { ...m, balance: data.balance } : m));
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: '网络请求失败，请检查网络后重试' });
    } finally {
      setBusy(false);
    }
  }

  if (!rounds.length) {
    return (
      <div className="card p-12 text-center text-fg3">
        暂无进行中的活动，请管理员在管理页发布期次
      </div>
    );
  }

  return (
    <section className="card relative p-8">
      <h2 className="section-title">1. 选择活动期次</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {rounds.map((r) => (
          <button
            key={r.id}
            onClick={() => setRoundId(r.id)}
            className={`rounded-lg border px-4 py-2.5 text-sm transition-all duration-150 ${
              r.id === roundId
                ? 'border-brand bg-brandsoft text-brand'
                : 'border-line bg-raise text-fg2 hover:text-fg'
            }`}
          >
            <span className="font-semibold">第 {r.roundNo} 期</span>
            <span className="ml-2 text-xs opacity-75">{fmtDateTime(r.drawAt)} 开奖</span>
            {r.rolloverFrom > 0 && (
              <span className="ml-2 rounded-full bg-brandsoft px-2 py-0.5 text-xs text-brand">
                滚存 +{fmtHOD(r.rolloverFrom)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          <div>
            <h2 className="section-title">2. 选择号码</h2>
            <div className="segmented mt-5">
              {(['single', 'multi', 'random'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} data-active={mode === m}>
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>

            {mode === 'single' && (
              <div className="mt-6">
                <p className="mb-3 text-sm text-fg2">逐位选择 6 位竞猜码（000000 - 999999）</p>
                <div className="flex flex-wrap gap-2">
                  {single.map((d, i) => (
                    <select
                      key={i}
                      value={d}
                      onChange={(e) =>
                        setSingle((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
                      }
                      className="rounded-lg border border-line bg-raise text-center text-xl font-semibold text-brand outline-none transition-all duration-150 hover:border-brand focus:border-brand"
                      style={{ height: '3.25rem', width: '3.25rem' }}
                    >
                      {DIGITS.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
                <p className="mt-3 text-sm text-fg2">
                  已选：
                  <span className="mono-num ml-1 text-lg font-semibold tracking-[0.2em] text-brand">
                    {single.join('')}
                  </span>
                </p>
              </div>
            )}

            {mode === 'multi' && (
              <div className="mt-6">
                <p className="mb-3 text-sm text-fg2">
                  每位可选多个数字，展开为所有组合（复式），当前{' '}
                  <span className="font-semibold text-brand">{comboCount}</span> 注
                </p>
                <div className="space-y-2">
                  {multi.map((sel, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-14 text-xs text-fg3">第 {i + 1} 位</span>
                      <div className="flex flex-wrap gap-1">
                        {DIGITS.map((d) => (
                          <button
                            key={d}
                            onClick={() => toggleMulti(i, d)}
                            className={sel.includes(d) ? 'digit-on' : 'digit-off'}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === 'random' && (
              <div className="mt-6">
                <p className="mb-3 text-sm text-fg2">机选注数（随机生成竞猜码）</p>
                <div className="flex items-center gap-3">
                  <select
                    value={randCount}
                    onChange={(e) => setRandCount(Number(e.target.value))}
                    className={selectCls}
                  >
                    {Array.from({ length: MAX_RANDOM }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} 注
                      </option>
                    ))}
                  </select>
                  <button onClick={regenerate} className="btn-secondary">
                    换一批
                  </button>
                </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {randCodes.map((c, i) => (
                <span
                  key={i}
                  className="mono-num rounded-lg border border-line bg-raise px-3.5 py-2 text-lg font-semibold tracking-[0.2em] text-brand shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                >
                  {c}
                </span>
              ))}
            </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="section-title">3. 投入档位</h2>
            <p className="mb-3 mt-1 text-xs text-fg3">倍投：投入越大，中奖奖金同步放大</p>
            <div className="flex flex-wrap gap-3">
              {TIERS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTier(t.value)}
                  className={tier === t.value ? 'tier-on' : 'tier-off'}
                >
                  <div className="text-lg font-semibold text-brand">{t.value}x</div>
                  <div className="text-xs text-fg3">{t.label}</div>
                </button>
              ))}
            </div>
            {round && (
              <p className="mt-2 text-xs text-fg3">每注 {fmtHOD(round.basePrice * tier)} HOD</p>
            )}
          </div>
        </div>

        <aside className="card relative h-fit space-y-5 p-6 lg:sticky lg:top-20">
          <TechCorners />
          <div>
            <p className="eyebrow">BET SUMMARY</p>
            <h3 className="mt-1 font-semibold text-fg">投注单</h3>
          </div>
          <dl className="space-y-2.5 text-sm text-fg2">
            <div className="flex justify-between">
              <dt>参与期次</dt>
              <dd className="font-medium text-fg">第 {round?.roundNo} 期</dd>
            </div>
            <div className="flex justify-between">
              <dt>投注方式</dt>
              <dd className="text-fg">{MODE_LABEL[mode]}</dd>
            </div>
            <div className="flex justify-between">
              <dt>注数</dt>
              <dd className="text-fg">{comboCount} 注</dd>
            </div>
            <div className="flex justify-between">
              <dt>档位</dt>
              <dd className="text-fg">{tier}x</dd>
            </div>
            <div className="flex justify-between">
              <dt>返奖率</dt>
              <dd className="text-fg">{round?.returnRate}%</dd>
            </div>
            {round && round.rolloverFrom > 0 && (
              <div className="flex justify-between">
                <dt>大奖滚存</dt>
                <dd className="text-brand">+{fmtHOD(round.rolloverFrom)} HOD</dd>
              </div>
            )}
          </dl>
          <div className="border-t border-line pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-fg2">总投入</span>
              <span className="mono-num num-grad text-2xl font-semibold">{fmtHOD(total)} HOD</span>
            </div>
            <p className="mt-2 text-xs text-fg3">
              账户余额：
              {me === 'loading' ? '加载中…' : me === null ? '未登录' : `${fmtHOD(balance)} HOD`}
            </p>
          </div>
          {me === null && (
            <Link href="/login" className="btn-primary w-full !py-2.5">
              登录后投注
            </Link>
          )}
          {me !== null && me !== 'loading' && !me.bound && (
            <div className="rounded-lg border border-warn/30 bg-warnsoft p-3 text-xs leading-relaxed text-warn">
              参与投注需先完成手机号或邮箱绑定（账户安全验证）。
              <Link href="/me" className="font-semibold text-brand hover:underline">
                去绑定 →
              </Link>
            </div>
          )}
          {me !== null && me !== 'loading' && me.bound && (
            <button
              onClick={submit}
              disabled={busy || !!invalid || insufficient || total === 0}
              className="btn-primary w-full !py-2.5"
            >
              {busy ? '提交中…' : '确认投注'}
            </button>
          )}
          {insufficient && <p className="text-xs text-err">余额不足，可在「我的」页领取算力</p>}
          {invalid && <p className="text-xs text-err">{invalid}</p>}
          {msg && (
            <p className={`text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>
          )}
        </aside>
      </div>
    </section>
  );
}
