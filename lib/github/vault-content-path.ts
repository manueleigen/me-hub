/**
 * Normalizes and validates user-supplied vault paths for GitHub repo content API.
 * Rejects path traversal and control characters.
 */
export function assertSafeVaultContentPath(raw: string): string {
	const trimmed = raw.trim().replace(/\\/g, "/");
	if (trimmed.includes("\0")) {
		throw new Error("Ungültiger Pfad.");
	}
	const segments = trimmed === "" ? [] : trimmed.split("/");
	for (const s of segments) {
		if (s === "..") {
			throw new Error("Pfad darf nicht „..“ enthalten.");
		}
	}
	return segments.join("/");
}
