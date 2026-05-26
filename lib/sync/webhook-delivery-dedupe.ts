/** In-memory idempotency for GitHub webhook X-GitHub-Delivery (replay / double POST). */

const TTL_MS = 24 * 60 * 60 * 1000;
const deliveries = new Map<string, number>();

function prune(now: number): void {
	for (const [id, ts] of deliveries) {
		if (now - ts > TTL_MS) deliveries.delete(id);
	}
}

/** @returns true if this delivery id was seen recently (reject duplicate sync). */
export function isDuplicateGitHubDelivery(deliveryId: string | null, now = Date.now()): boolean {
	if (!deliveryId?.trim()) return false;
	prune(now);
	const id = deliveryId.trim();
	if (deliveries.has(id)) return true;
	deliveries.set(id, now);
	return false;
}
