// 轻量内存限流（无额外依赖）。按「客户端 IP + 自定义 key」计数，窗口到期自动清理。
// 适用于单进程部署；若以后改成多实例，请换成 Redis 之类的共享存储。
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 10, keyPrefix = 'rl' } = {}) {
  const hits = new Map();

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, Math.min(windowMs, 60 * 1000));
  timer.unref?.();

  return function rateLimit(req, res, next) {
    const key = `${keyPrefix}:${req.ip}`;
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many attempts, please try again later' });
    }

    next();
  };
}
