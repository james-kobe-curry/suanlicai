import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, isAdmin } from '@/lib/api';
import { PRIZE_LEVELS } from '@/lib/constants';

const MICRO = 1_000_000;

/** CSV 导出某期中奖名单 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (!isAdmin(user)) return fail('无管理权限', 403);

  const { id } = await params;
  const round = await prisma.round.findUnique({ where: { id } });
  if (!round) return fail('期次不存在', 404);

  const winners = await prisma.bet.findMany({
    where: { roundId: id, status: 'WON' },
    orderBy: { prize: 'desc' },
    include: { user: { select: { username: true } } },
  });

  const lvName = (lv: number | null) => PRIZE_LEVELS.find(l => l.level === lv)?.name ?? '-';
  // 奖金用纯数字（HOD），不加 万/亿 单位，确保 Excel 可解析
  const toHODStr = (micro: bigint) => (Number(micro) / MICRO).toString();
  const BOM = '\uFEFF';
  const rows = [['用户名', '竞猜码', '档位', '奖级', '奖金(HOD)'].join(',')];
  for (const w of winners) {
    rows.push([w.user.username, w.code, `${w.tier}x`, lvName(w.winLevel), toHODStr(w.prize)].join(','));
  }
  const csv = BOM + rows.join('\n');
  const filename = `第${round.roundNo}期中奖名单.csv`;
  const encoded = encodeURIComponent(filename);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
    },
  });
}