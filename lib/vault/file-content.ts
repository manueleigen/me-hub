import { parseFrontmatter, serializeFrontmatter } from "@/lib/frontmatter"
import type { VaultFile, VaultFrontmatter } from "@/types/vault"

export function parseVaultFileContent(file: VaultFile): {
	frontmatter: VaultFrontmatter
	body: string
} {
	const raw = file.content ?? ""
	const parsed = parseFrontmatter(raw)
	const frontmatter = (
		file.frontmatter && Object.keys(file.frontmatter).length > 0
			? file.frontmatter
			: parsed.data
	) as VaultFrontmatter

	return {
		frontmatter,
		body: parsed.content,
	}
}

export function composeVaultFileContent(
	frontmatter: VaultFrontmatter,
	body: string,
): string {
	if (Object.keys(frontmatter).length === 0) {
		return body
	}
	return serializeFrontmatter(frontmatter, body)
}
