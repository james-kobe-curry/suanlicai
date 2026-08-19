import LeaderboardTable from '@/components/LeaderboardTable';

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-brand">Leaderboard</p>
        <h1 className="mt-1 text-2xl font-semibold text-fg">排行榜</h1>
        <p className="mt-1 text-sm text-fg2">谁是最强算力玩家？按净收益、胜率、投入等多维度排名</p>
      </div>
      <LeaderboardTable />
    </div>
  );
}