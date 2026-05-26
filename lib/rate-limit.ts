type Bucket = { count: number; resetAt: number };

/** In-process limiter (fine for single-instance; use Redis/Edge for multi-instance). */
const buckets = new Map<string, Bucket>();

export type RateLimitResult =
	| { ok: true }
	| { ok: false; retryAfterSec: number };

/**
 * Sliding-window style limit per key.
 * @returns whether this request is allowed.
 */
export function checkRateLimit(
	key: string,
	opts: { limit: number; windowMs: number },
): RateLimitResult {
	const now = Date.now();
	const windowMs = Math.max(opts.windowMs, 1000);
	const limit = Math.max(opts.limit, 1);

	// Periodic cleanup to avoid unbounded Map growth
	if (buckets.size > 50_000) {
		for (const [k, v] of buckets) {
			if (v.resetAt < now) buckets.delete(k);
		}
	}

	let b = buckets.get(key);
	if (!b || now >= b.resetAt) {
		b = { count: 0, resetAt: now + windowMs };
		buckets.set(key, b);
	}

	b.count += 1;
	if (b.count > limit) {
		const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
		return { ok: false, retryAfterSec };
	}

	return { ok: true };
}

export function rateLimitClientKey(request: Request, prefix: string): string {
	const xf = request.headers.get("x-forwarded-for");
	const cf = xf?.split(",")[0]?.trim();
	const realIp = request.headers.get("x-real-ip")?.trim();
	const ip = cf || realIp || "unknown";
	return `${prefix}:${ip}`;
}
