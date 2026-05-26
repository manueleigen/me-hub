import type { NextRequest } from "next/server";
import { proxy as runProxy } from "./proxy";

export function middleware(request: NextRequest) {
	return runProxy(request);
}

export { config } from "./proxy";
