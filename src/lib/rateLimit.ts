/**
 * 轻量内存滑动窗口速率限制（单进程，适合 SQLite + 单实例部署）
 * 生产环境建议替换为 Redis 方案
 */

interface Window {
  timestamps: number[];
}

const store = new Map<string, Window>();

// 每 5 分钟清理过期条目
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of store) {
    w.timestamps = w.timestamps.filter((t) => now - t < 3600_000);
    if (!w.timestamps.length) store.delete(key);
  }
}, 300_000).unref();

/**
 * 检查并记录一次请求。返回 true 表示允许，false 表示超限。
 * @param key   标识（通常是 IP）
 * @param max   窗口内最大次数
 * @param windowMs 窗口毫秒数
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let w = store.get(key);
  if (!w) {
    store.set(key, (w = { timestamps: [] }));
  }
  // 清理窗口外记录
  w.timestamps = w.timestamps.filter((t) => now - t < windowMs);
  if (w.timestamps.length >= max) return false;
  w.timestamps.push(now);
  return true;
}

/** 从请求头提取客户端 IP */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}