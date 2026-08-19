import { prisma } from '@/lib/prisma';
import { serRound } from '@/lib/serialize';
import { ok } from '@/lib/api';

export async function GET() {
  const rounds = await prisma.round.findMany({
    orderBy: { roundNo: 'desc' },
    take: 100,
  });
  return ok({ rounds: rounds.map(serRound) });
}
