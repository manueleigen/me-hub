const EMPTY_BODY_TEMPLATE = /^## Details\s*\n+## Beschreibung\s*$/;

/** Markdown body suitable for read-only display on the project page. */
export function projectBodyForDisplay(body: string | undefined): string | null {
	const trimmed = body?.trim() ?? "";
	if (!trimmed) return null;
	if (EMPTY_BODY_TEMPLATE.test(trimmed)) return null;
	return trimmed;
}
