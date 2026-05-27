import { slugify } from "@/lib/frontmatter";

/** URL segment for a workspace page from its display name. */
export function pageSlugFromLabel(label: string, fallback = "page"): string {
	const slug = slugify(label.trim());
	return slug || fallback;
}
