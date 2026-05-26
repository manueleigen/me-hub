import { parseFrontmatter } from "@/lib/frontmatter";

export function buildMirrorRowFields(text: string): {
	content: string;
	frontmatterJson: string | null;
} {
	const { data } = parseFrontmatter(text);
	const frontmatterJson =
		Object.keys(data).length > 0 ? JSON.stringify(data) : null;
	return { content: text, frontmatterJson };
}
