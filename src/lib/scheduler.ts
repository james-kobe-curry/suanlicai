import { tick } from './engine';

const INTERVAL_MS = 15_000;

/** 启动后台调度器（幂等，防 dev HMR 重复启动） */
export function startScheduler() {
  const g = globalThis as unknown as { __hodSchedulerStarted?: boolean };
  if (g.__hodSchedulerStarted) return;
  g.__hodSchedulerStarted = true;

  setInterval(() => {
    tick().catch((e) => console.error('[scheduler] tick 失败:', e));
  }, INTERVAL_MS);

  console.log(`[scheduler] 已启动，每 ${INTERVAL_MS / 1000}s 检查期次状态`);
}
