import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { serRound } from '@/lib/serialize';
import { fmtHOD, fmtDateTime } from '@/lib/fmt';
import BettingPanel from '@/components/BettingPanel';
import Countdown from '@/components/Countdown';
import DigitBall from '@/components/DigitBall';
import TechCorners from '@/components/TechCorners';
import WinnerTicker from '@/components/WinnerTicker';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const now = new Date();
  const [openRounds, latest, drawnCount, paidAgg] = await Promise.all([
    prisma.round.findMany({
      where: { status: 'OPEN', betCloseAt: { gt: now } },
      orderBy: { drawAt: 'asc' },
    }),
    prisma.round.findFirst({ where: { status: 'DRAWN' }, orderBy: { drawnAt: 'desc' } }),
    prisma.round.count({ where: { status: 'DRAWN' } }),
    prisma.round.aggregate({ where: { status: 'DRAWN' }, _sum: { prizePool: true } }),
  ]);

  const next = openRounds[0];
  const jackpot = next?.rolloverFrom ?? 0n;
  const totalPaid = paidAgg._sum.prizePool ?? 0n;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="card card-hover relative overflow-hidden p-10">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <TechCorners />

        <div className="relative flex flex-wrap items-end justify-between gap-10">
          <div>
            <p className="eyebrow text-brand">HOD Power Lottery</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-fg">
              用算力 · 猜<span className="num-grad">大奖</span>
            </h1>
            <p className="mt-3 text-sm text-fg2">
              每期 6 位竞猜码 · 80% 返奖 · SHA-256 哈希承诺公平可验证
            </p>

            {latest?.winningCode && (
              <div className="mt-8">
                <div className="flex items-center gap-2">
                  <p className="eyebrow">Last Draw · 第 {latest.roundNo} 期</p>
                </div>
                <div className="code-display mt-3">
                  {latest.winningCode.split('').map((d, i) => (
                    <DigitBall key={i} d={d} size="lg" accent />
                  ))}
                </div>
                <Link
                  href={`/rounds/${latest.id}`}
                  className="mt-3 inline-block text-xs text-brand transition-colors duration-150 hover:text-brand2 hover:underline"
                >
                  查看详情 →
                </Link>
              </div>
            )}
          </div>

          <div className="relative rounded-xl border border-line bg-raise p-6 text-center">
            {next ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <span className="tick" />
                  <p className="eyebrow">Round {next.roundNo} · 投注进行中</p>
                </div>
                <div className="mt-4">
                  <Countdown target={next.betCloseAt.toISOString()} />
                </div>
                <p className="mt-4 text-xs text-fg3">开奖时间 {fmtDateTime(next.drawAt)}</p>
              </>
            ) : (
              <p className="py-4 text-sm text-fg3">暂无进行中的期次</p>
            )}
          </div>
        </div>

        {/* 统计条 */}
        <div className="relative mt-10 grid grid-cols-3 gap-4 border-t border-line pt-8 text-center">
          <div>
            <p className="eyebrow">Jackpot</p>
            <p className="mono-num num-grad mt-2 text-2xl font-semibold">{fmtHOD(jackpot)}</p>
            <p className="mt-1 text-xs text-fg3">本期滚存大奖 · HOD</p>
          </div>
          <div className="border-x border-line">
            <p className="eyebrow">Rounds Drawn</p>
            <p className="mono-num mt-2 text-2xl font-semibold text-fg">{drawnCount}</p>
            <p className="mt-1 text-xs text-fg3">已开奖期数</p>
          </div>
          <div>
            <p className="eyebrow">Total Paid</p>
            <p className="mono-num mt-2 text-2xl font-semibold text-ok">{fmtHOD(totalPaid)}</p>
            <p className="mt-1 text-xs text-fg3">累计派奖 · HOD</p>
          </div>
        </div>
      </section>

      <WinnerTicker />

      {/* 投注 */}
      <section className="fade-up" style={{ animationDelay: '0.08s' }}>
        <h2 className="section-title mb-5">立即投注</h2>
        <BettingPanel rounds={openRounds.map(serRound)} />
      </section>
    </div>
  );
}
