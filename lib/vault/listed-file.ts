import { parseFrontmatter, serializeFrontmatter } from "@/lib/frontmatter";
import type { ListedMarkdownFile } from "@/lib/vault/list-markdown";

export function getListedFileFrontmatter(
	file: ListedMarkdownFile,
): Record<string, unknown> {
	if (file.frontmatter) return file.frontmatter;
	return parseFrontmatter(file.content).data;
}

export function getListedFileBody(file: ListedMarkdownFile): string {
	if (file.frontmatter) {
		if (file.content) return parseFrontmatter(file.content).content;
		return "";
	}
	return parseFrontmatter(file.content).content;
}

/** Full markdown document for parsing — uses stored body when the list query omitted content. */
export function getListedFileRaw(file: ListedMarkdownFile): string {
	if (file.content.trim()) return file.content;
	return serializeFrontmatter(
		getListedFileFrontmatter(file),
		getListedFileBody(file),
	);
}
