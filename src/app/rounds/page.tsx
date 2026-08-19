import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { serRound } from '@/lib/serialize';
import { fmtHOD, fmtDateTime } from '@/lib/fmt';
import RoundBadge from '@/components/RoundBadge';
import DigitBall from '@/components/DigitBall';

export const dynamic = 'force-dynamic';

export default async function RoundsPage() {
  const rounds = await prisma.round.findMany({ orderBy: { roundNo: 'desc' }, take: 100 });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-brand">Public Ledger</p>
        <h1 className="mt-1 text-2xl font-semibold text-fg">开奖公示</h1>
        <p className="mt-1 text-sm text-fg2">每一期开奖码、奖池与派奖，公开可验证</p>
      </div>

      {/* 公平性原理 */}
      <div className="card p-7">
        <p className="eyebrow text-brand">How It Works</p>
        <h3 className="mt-1 text-lg font-semibold text-fg">每次开奖，数学保证公平</h3>

        {/* 三步图 */}
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-base font-bold text-brandfg shadow-sm">
              1
            </span>
            <p className="mt-3 text-sm font-semibold text-fg">先锁</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg2">
              期次发布时，开奖码用 SHA-256「拍照」锁定并公示指纹。加了随机盐，任何人都无法在开奖前反推号码。
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-base font-bold text-brandfg shadow-sm">
              2
            </span>
            <p className="mt-3 text-sm font-semibold text-fg">后开</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg2">
              到点自动开奖，公布开奖码原文与随机盐。所有数据公开可查。
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-base font-bold text-brandfg shadow-sm">
              3
            </span>
            <p className="mt-3 text-sm font-semibold text-fg">可验</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg2">
              你拿公布的数字和盐自己算一遍 SHA-256，和公示指纹比对——对上了就是真的，对不上就是被换过。
            </p>
          </div>
        </div>

        {/* 一句话 */}
        <div className="mt-6 rounded-xl border border-brand/20 bg-brandsoft px-5 py-4 text-center">
          <p className="text-sm font-medium text-brand">
            先锁码、后开奖、谁都能验——<span className="font-semibold">不用信平台，信数学就够。</span>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-fg3">
          点下方表格任一「详情」，输入开奖码即可亲自验证 ·
          <a href="/rules" className="ml-1 text-brand hover:underline">查看完整原理</a>
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="tbl min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th>期号</th>
              <th>状态</th>
              <th>投注截止</th>
              <th>开奖时间</th>
              <th>销售额</th>
              <th>开奖码</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r0) => {
              const r = serRound(r0);
              return (
                <tr key={r.id}>
                  <td className="font-medium text-fg">第 {r.roundNo} 期</td>
                  <td>
                    <RoundBadge status={r.status} />
                  </td>
                  <td className="text-fg2">{fmtDateTime(r.betCloseAt)}</td>
                  <td className="text-fg2">{fmtDateTime(r.drawAt)}</td>
                  <td className="mono-num text-fg">{fmtHOD(r.totalSales)}</td>
                  <td>
                    {r.winningCode ? (
                      <div className="flex gap-1">
                        {r.winningCode.split('').map((d, i) => (
                          <DigitBall key={i} d={d} size="sm" />
                        ))}
                      </div>
                    ) : r.status === 'CANCELED' ? (
                      <span className="text-xs text-fg3">—</span>
                    ) : (
                      <span className="text-xs text-fg3">开奖后公示</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/rounds/${r.id}`}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                    >
                      详情
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!rounds.length && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-fg3">
                  暂无期次
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
