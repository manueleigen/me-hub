import { getVaultConfig } from "@/lib/vault/config";
import { getUserVaultService } from "@/lib/vault/server";
import { VaultShell } from "@/components/vault/vault-shell";

export default async function VaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const svc = await getUserVaultService();
	const tree = await svc.getTree();
	const { owner, repo } = await getVaultConfig();
	const gitHubBase =
		owner && repo ? `https://github.com/${owner}/${repo}` : "";

	return (
		<VaultShell tree={tree} gitHubBase={gitHubBase}>
			{children}
		</VaultShell>
	);
}
