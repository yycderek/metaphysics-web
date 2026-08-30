// 简单内存限流：按 key（如 IP）滑动窗口（每分钟）+ 每日上限。
// 单实例/小规模够用；生产可换 Redis。默认值经 env 可调，本地开发宽松防误伤。
const WINDOW_MS = 60_000;

interface Bucket {
  counts: number[];
  day: string;
  daily: number;
}
const buckets = new Map<string, Bucket>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function rateLimit(
  key: string,
  perMin = 30,
  perDay = 300,
): { ok: true } | { ok: false; limit: string } {
  const now = Date.now();
  const day = today();
  let b = buckets.get(key);
  if (!b || b.day !== day) {
    b = { counts: [], day, daily: 0 };
    buckets.set(key, b);
  }
  b.counts = b.counts.filter((t) => now - t < WINDOW_MS);
  if (b.counts.length >= perMin) {
    return { ok: false, limit: `每分钟最多 ${perMin} 次请求` };
  }
  if (b.daily >= perDay) {
    return { ok: false, limit: `每日最多 ${perDay} 次请求` };
  }
  b.counts.push(now);
  b.daily += 1;
  return { ok: true };
}

/** 测试用：清空计数 */
export function resetRateLimits(): void {
  buckets.clear();
}
