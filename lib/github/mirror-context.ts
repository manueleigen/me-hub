import { getCachedMirrorReadContext } from "@/lib/cache/server";

export type { MirrorReadContext } from "@/lib/cache/server";

export async function getMirrorReadContext() {
	return getCachedMirrorReadContext();
}
