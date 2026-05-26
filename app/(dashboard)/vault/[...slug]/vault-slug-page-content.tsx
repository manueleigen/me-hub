import { notFound } from "next/navigation";
import { getUserVaultService } from "@/lib/vault/server";
import { AppHeader } from "@/components/layout/app-header";
import { VaultViewer } from "@/components/vault/vault-viewer";
import { VaultDirectory } from "@/components/vault/vault-directory";
import { VaultFile } from "@/types/vault";
import { vaultItemPath, vaultListPath } from "@/lib/workspace-paths";

interface VaultSlugPageContentProps {
	slug: string[];
	workspaceSlug: string;
}

export async function VaultSlugPageContent({
	slug,
	workspaceSlug,
}: VaultSlugPageContentProps) {
	const path = slug.join("/") as string;
	const svc = await getUserVaultService();
	const file = await svc.getFile(path);

	if (!file) {
		return <VaultFinderPage path={path} />;
	}

	const breadcrumbs = [
		{ label: "Vault", href: vaultListPath(workspaceSlug) },
		...svc.getBreadcrumbs(path).map((crumb, index, array) => ({
			label: crumb.name,
			href:
				index < array.length - 1
					? vaultItemPath(workspaceSlug, crumb.path)
					: undefined,
		})),
	];

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<AppHeader breadcrumbs={breadcrumbs} />
			<div className="flex min-h-0 flex-1 overflow-auto">
				{file.type === "directory" ? (
					<VaultDirectory directory={file} />
				) : (
					<VaultViewer file={file} />
				)}
			</div>
		</div>
	);
}

async function VaultFinderPage({ path }: { path: string }) {
	const svc = await getUserVaultService();
	const folderContent = await svc.getFolderContents(path);

	if (!folderContent) {
		notFound();
	}
	const directory = {
		path,
		name: path.split("/").pop() || "Vault",
		title: "",
		type: "directory",
		children: folderContent,
	} as VaultFile;

	return <VaultDirectory directory={directory} />;
}
