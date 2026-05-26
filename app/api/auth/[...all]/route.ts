import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitClientKey } from "@/lib/rate-limit";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

const handlers = toNextJsHandler(auth);

/** Per-IP throttle (single-instance memory; upgrade to Redis for horizontal scale). */
const AUTH_RATE = { limit: 120, windowMs: 60_000 };

function withAuthRateLimit(
	handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
	return async (request: Request) => {
		const key = rateLimitClientKey(request, "better-auth");
		const limited = checkRateLimit(key, AUTH_RATE);
		if (!limited.ok) {
			return NextResponse.json(
				{ error: "Too many requests" },
				{
					status: 429,
					headers: { "Retry-After": String(limited.retryAfterSec) },
				},
			);
		}
		return handler(request);
	};
}

export const GET = withAuthRateLimit(handlers.GET);
export const POST = withAuthRateLimit(handlers.POST);
