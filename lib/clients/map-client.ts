import { getListedFileFrontmatter } from "@/lib/vault/listed-file";
import type { ListedMarkdownFile } from "@/lib/vault/list-markdown";
import type { Client } from "@/types/clients";
import { clientDisplayName } from "./vault-paths";

export function mapListedFileToClient(slug: string, file: ListedMarkdownFile): Client {
	const data = getListedFileFrontmatter(file);
	return {
		slug,
		sha: file.sha,
		name: clientDisplayName(data, slug),
		type: data.type as string | undefined,
		contact: data.contact as string | undefined,
		email: data.email as string | undefined,
		phone: data.phone as string | undefined,
		website: data.website as string | undefined,
		address: data.address as string | undefined,
		hourlyRate: data.hourlyRate as number | undefined,
		status: (data.status as Client["status"]) ?? "prospect",
		since: data.since as string | undefined,
		notes: data.notes as string | undefined,
	};
}
