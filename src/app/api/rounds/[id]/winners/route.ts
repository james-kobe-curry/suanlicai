import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';

const PAGE_SIZE = 50;

/** 获取指定期次中奖记录（支持分页和筛选） */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const round = await prisma.round.findUnique({ where: { id } });
  if (!round) return fail('期次不存在', 404);

  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') || undefined;
  const search = searchParams.get('search') || undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { roundId: id, status: 'WON' };
  if (level) where.winLevel = Number(level);

  const [all, total] = await Promise.all([
    prisma.bet.findMany({
      where,
      orderBy: [{ winLevel: 'asc' }, { prize: 'desc' }],
      include: { user: { select: { username: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.bet.count({ where }),
  ]);

  // 如果指定了搜索关键词，需要应用侧筛选（因为跨表 username）
  let filtered = all;
  if (search) {
    const kw = search.toLowerCase();
    filtered = all.filter(
      (w) => w.user.username.toLowerCase().includes(kw) || w.code.includes(kw),
    );
  }

  const winners = filtered.map((w) => ({
    id: w.id,
    username: w.user.username,
    code: w.code,
    tier: w.tier,
    winLevel: w.winLevel,
    prize: String(w.prize),
  }));

  return ok({
    winners,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    round: {
      roundNo: round.roundNo,
      winningCode: round.winningCode,
      drawnAt: round.drawnAt?.toISOString() ?? round.drawAt.toISOString(),
    },
  });
}