/** Placeholder slug for unsaved records in detail drawers. */
export const DRAFT_RECORD_SLUG = "__draft__";

export function isDraftSlug(slug: string): boolean {
	return slug === DRAFT_RECORD_SLUG;
}
