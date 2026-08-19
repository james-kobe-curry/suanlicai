import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fmtHOD, fmtDateTime } from '@/lib/fmt';
import { PRIZE_LEVELS } from '@/lib/constants';
import RoundBadge from '@/components/RoundBadge';
import DigitBall from '@/components/DigitBall';
import VerifyBox from '@/components/VerifyBox';
import TechCorners from '@/components/TechCorners';
import RoundAllWinners from '@/components/RoundAllWinners';

export const dynamic = 'force-dynamic';

export default async function RoundDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const round = await prisma.round.findUnique({ where: { id } });
  if (!round) notFound();

  const stats = await prisma.bet.groupBy({
    by: ['winLevel'],
    where: { roundId: id, status: 'WON' },
    _count: { _all: true },
    _sum: { prize: true },
  });
  const totalWinners = await prisma.bet.count({ where: { roundId: id, status: 'WON' } });
  const winners = await prisma.bet.findMany({
    where: { roundId: id, status: 'WON' },
    orderBy: { prize: 'desc' },
    take: 20,
    include: { user: { select: { username: true } } },
  });
  const user = await getSessionUser();
  const myBets = user
    ? await prisma.bet.findMany({
        where: { roundId: id, userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const drawn = round.status === 'DRAWN';
  const levelName = (lv: number | null) => PRIZE_LEVELS.find((l) => l.level === lv)?.name ?? '-';

  return (
    <div className="space-y-6">
      {/* 期次信息 + 开奖码 */}
      <div className="card relative overflow-hidden p-7">
        <TechCorners />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-brand">Round {round.roundNo}</p>
            <h1 className="mt-1 text-2xl font-semibold text-fg">第 {round.roundNo} 期</h1>
          </div>
          <RoundBadge status={round.status} />
        </div>
        <div className="mt-4 grid gap-2 text-sm text-fg2 sm:grid-cols-2">
          <p>
            投注截止：<span className="text-fg">{fmtDateTime(round.betCloseAt)}</span>
          </p>
          <p>
            开奖时间：<span className="text-fg">{fmtDateTime(round.drawAt)}</span>
          </p>
          <p>
            销售额：
            <span className="mono-num text-fg">{fmtHOD(round.totalSales)} HOD</span>
          </p>
          <p>
            返奖率：<span className="text-fg">{round.returnRate}%</span> · 每注基础价{' '}
            <span className="text-fg">{fmtHOD(round.basePrice)} HOD</span>
          </p>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          {drawn && round.winningCode ? (
            <div className="fade-up">
              <p className="eyebrow">Winning Code · {fmtDateTime(round.drawnAt ?? round.drawAt)} 开奖</p>
              <div className="code-display mt-3">
                {round.winningCode.split('').map((d, i) => (
                  <DigitBall key={i} d={d} size="lg" accent />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-fg3">开奖码将在开奖后公示，当前仅公示哈希承诺</p>
          )}

          <div className="mt-5 space-y-2 break-all text-xs text-fg3">
            <p>
              承诺哈希：
              <span className="rounded bg-raise px-2 py-1 font-mono text-fg2">{round.codeHash}</span>
            </p>
            {drawn && (
              <p>
                随机盐：
                <span className="rounded bg-raise px-2 py-1 font-mono text-fg2">{round.salt}</span>
              </p>
            )}
          </div>

          <div className="mt-5 max-w-xl">
            <p className="mb-2 text-xs text-fg3">
              公平性校验：输入任意 6 位数字，计算 sha256(数字|盐) 与期次创建时公示的承诺哈希比对
            </p>
            <VerifyBox hash={round.codeHash} salt={drawn ? round.salt : null} code={drawn ? round.winningCode : null} />
          </div>
        </div>
      </div>

      {/* 奖级派奖 */}
      <div className="card p-7">
        <h2 className="section-title">奖级派奖</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="tbl min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th>奖级</th>
                <th>中奖条件</th>
                <th>奖池占比</th>
                <th>中奖注数</th>
                <th>实派奖金</th>
              </tr>
            </thead>
            <tbody>
              {PRIZE_LEVELS.map((L) => {
                const s = stats.find((x) => x.winLevel === L.level);
                return (
                  <tr key={L.level}>
                    <td className="font-medium text-brand">{L.name}</td>
                    <td className="text-fg2">{L.desc}</td>
                    <td className="mono-num text-fg">{L.pct}%</td>
                    <td className="mono-num text-fg">{s?._count._all ?? 0}</td>
                    <td className="mono-num text-fg">{fmtHOD(s?._sum.prize ?? 0n)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {round.rolloverTo > 0n && (
          <p className="mt-4 text-sm text-brand">
            本期一等奖无人中，{fmtHOD(round.rolloverTo)} HOD 已滚存至后续期次
          </p>
        )}
        {round.rolloverFrom > 0n && (
          <p className="mt-1.5 text-sm text-fg2">
            本期一等奖含上期滚存 {fmtHOD(round.rolloverFrom)} HOD
          </p>
        )}
      </div>

      {/* 中奖榜单 */}
      {winners.length > 0 && (
        <div className="card p-7">
          <h2 className="section-title">中奖榜单</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="tbl min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th>用户</th>
                  <th>竞猜码</th>
                  <th>档位</th>
                  <th>奖级</th>
                  <th>奖金</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((w) => (
                  <tr key={w.id}>
                    <td className="font-medium text-fg">{w.user.username}</td>
                    <td className="mono-num tracking-[0.2em] text-brand">{w.code}</td>
                    <td className="text-fg2">{w.tier}x</td>
                    <td className="text-fg">{levelName(w.winLevel)}</td>
                    <td className="mono-num text-ok">+{fmtHOD(w.prize)} HOD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 查看全部中奖名单（可展开） */}
      <RoundAllWinners roundId={round.id} initialTotal={totalWinners} />

      {/* 我的投注 */}
      {user && myBets.length > 0 && (
        <div className="card p-7">
          <h2 className="section-title">我的投注（本期）</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="tbl min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th>竞猜码</th>
                  <th>档位</th>
                  <th>投入</th>
                  <th>状态</th>
                  <th>奖金</th>
                </tr>
              </thead>
              <tbody>
                {myBets.map((b) => (
                  <tr key={b.id}>
                    <td className="mono-num tracking-[0.2em] text-brand">{b.code}</td>
                    <td className="text-fg2">{b.tier}x</td>
                    <td className="mono-num text-fg">{fmtHOD(b.stake)}</td>
                    <td className="text-fg">
                      {b.status === 'WON'
                        ? `中奖 · ${levelName(b.winLevel)}`
                        : b.status === 'LOST'
                          ? '未中奖'
                          : b.status === 'REFUNDED'
                            ? '已退款'
                            : '待开奖'}
                    </td>
                    <td className="mono-num text-ok">
                      {b.prize > 0n ? `+${fmtHOD(b.prize)} HOD` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
