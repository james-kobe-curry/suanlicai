export async function register() {
  // 仅在 Node 服务运行时启动（构建阶段不启动）
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build') {
    // 启用 SQLite WAL 模式（读写并发性能提升）
    const { prisma } = await import('./lib/prisma');
    await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL');

    const { startScheduler } = await import('./lib/scheduler');
    startScheduler();
  }
}
