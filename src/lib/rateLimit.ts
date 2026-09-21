// Basic fixed-window rate limiter, keyed by route + client IP.
//
// This is an in-memory Map, scoped to the running server instance — on
// Vercel that means it only throttles requests landing on the same warm
// serverless instance, not globally across every instance/region, and a
// cold start clears it entirely. That's a real limitation, not a
// full/global rate limit — but it's still a meaningful, zero-dependency
// speed bump against casual abuse (a script hammering the endpoint from
// one IP), which is what "basic" means here. For a real guarantee across
// instances, a shared store (Upstash Redis, Vercel KV) would be needed —
// deliberately not added here since it's a new paid dependency this
// project doesn't otherwise have.
const hits = new Map<string, { count: number; windowStart: number }>();

// Prevents the Map from growing forever across a long-lived warm instance.
function sweep(now: number, windowMs: number) {
  for (const [key, v] of hits) {
    if (now - v.windowStart > windowMs) hits.delete(key);
  }
}

/**
 * Returns true if the request is within the allowed rate, false if it
 * should be rejected (429). `key` should already include the route name so
 * limits on different routes don't share a budget.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (hits.size > 5000) sweep(now, windowMs);

  const entry = hits.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    hits.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

/** Best-effort client IP from the headers Vercel sets on every request. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
