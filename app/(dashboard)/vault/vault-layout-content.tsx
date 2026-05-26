import { getCachedVaultConfig } from "@/lib/cache/server";
import { getCachedVaultTree } from "@/lib/vault/server";
import { VaultShell } from "@/components/vault/vault-shell";

export async function VaultLayoutContent({
	children,
}: {
	children: React.ReactNode;
}) {
	const [{ owner, repo }, tree] = await Promise.all([
		getCachedVaultConfig(),
		getCachedVaultTree(),
	]);
	const gitHubBase =
		owner && repo ? `https://github.com/${owner}/${repo}` : "";

	return (
		<VaultShell tree={tree} gitHubBase={gitHubBase}>
			{children}
		</VaultShell>
	);
}
