// Simple in-memory rate limiter for API endpoints
// Resets on deploy (serverless function cold start)

const rateMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs?: number; // time window in ms (default: 60s)
  max?: number; // max requests per window (default: 60)
}

export function rateLimit(key: string, config: RateLimitConfig = {}) {
  const { windowMs = 60_000, max = 60 } = config;
  const now = Date.now();

  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  entry.count++;

  if (entry.count > max) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: max - entry.count };
}

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(key);
  }
}, 300_000); // every 5 min
