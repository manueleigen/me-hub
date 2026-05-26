import { headers } from "next/headers";
import {
	resolveActiveWorkspaceForUser,
	resolveWorkspaceForUser,
} from "@/app/actions/workspaces";
import { WorkspaceContextHost } from "@/components/layout/workspace-context-host";
import { VaultLinkProvider } from "@/lib/vault-link-context";
import { resolveActiveVaultLinkStatus } from "@/lib/vault/workspace-vault-status";

const WORKSPACE_PATH = /^\/w\/([^/]+)(?:\/|$)/;

/**
 * Supplies workspace context for the dashboard shell (sidebar + pages).
 * Server render uses the URL slug on `/w/[slug]/*`, otherwise the active
 * workspace preference. Client navigations are synced in WorkspaceContextHost.
 */
export async function DashboardWorkspaceBoundary({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = (await headers()).get("x-pathname") ?? "";
	const match = pathname.match(WORKSPACE_PATH);

	const resolved = match
		? await resolveWorkspaceForUser(match[1])
		: await resolveActiveWorkspaceForUser();

	const { vaultLinked, settingsHref } = await resolveActiveVaultLinkStatus(resolved);

	return (
		<VaultLinkProvider
			vaultLinked={vaultLinked}
			settingsHref={settingsHref}
			workspaceId={resolved?.workspace.id ?? null}
		>
			<WorkspaceContextHost initial={resolved}>{children}</WorkspaceContextHost>
		</VaultLinkProvider>
	);
}
