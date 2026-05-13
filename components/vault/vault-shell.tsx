"use client";

import { SyncProvider } from "@/lib/vault/sync-context";
import { SyncIndicator } from "./sync-indicator";
import { VaultSidebar } from "./vault-sidebar";
import type { VaultTreeNode } from "@/types/vault";

interface VaultShellProps {
	tree: VaultTreeNode[];
	gitHubBase: string;
	children: React.ReactNode;
}

export function VaultShell({ tree, gitHubBase, children }: VaultShellProps) {
	return (
		<SyncProvider>
			<div className="flex flex-1 overflow-hidden">
				<VaultSidebar tree={tree} gitHubBase={gitHubBase} />
				<div className="flex-1 flex flex-col overflow-hidden">{children}</div>
			</div>
			<SyncIndicator />
		</SyncProvider>
	);
}
