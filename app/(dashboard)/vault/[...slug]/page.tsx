import { notFound } from "next/navigation";
import { getUserVaultService } from "@/lib/vault/server";
import { AppHeader } from "@/components/layout/app-header";
import { VaultViewer } from "@/components/vault/vault-viewer";
import { VaultDirectory } from "@/components/vault/vault-directory";
import { VaultFile } from "@/types/vault";

interface VaultPageProps {
	params: Promise<{
		slug: string[];
	}>;
}

export default async function VaultFilePage({ params }: VaultPageProps) {
	const { slug } = await params;
	const path = slug.join("/") as string;
	const svc = await getUserVaultService();
	const file = await svc.getFile(path);

	if (!file) {
		return <VaultFinderPage path={path} />;
		notFound();
	}

	const breadcrumbs = [
		{ label: "Vault", href: "/vault" },
		...svc.getBreadcrumbs(path).map((crumb, index, array) => ({
			label: crumb.name,
			href: index < array.length - 1 ? `/vault/${crumb.path}` : undefined,
		})),
	];

	return (
		<>
			<AppHeader breadcrumbs={breadcrumbs} />
			<div className="flex-1 overflow-auto">
				{file.type === "directory" ? (
					<VaultDirectory directory={file} />
				) : (
					<VaultViewer file={file} />
				)}
			</div>
		</>
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

	return (
		<>
			<VaultDirectory directory={directory} />
		</>
	);
}
