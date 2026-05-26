"use client";

import { VaultSidebar } from "./vault-sidebar";
import { VaultShellProvider } from "./vault-shell-context";
import type { VaultTreeNode } from "@/types/vault";

interface VaultShellProps {
	tree: VaultTreeNode[];
	gitHubBase: string;
	children: React.ReactNode;
}

/** Vault file tree (inner panel); sync + navigation save live in DashboardShell. */
export function VaultShell({ tree, gitHubBase, children }: VaultShellProps) {
	return (
		<VaultShellProvider gitHubBase={gitHubBase}>
			<div className="flex min-h-0 flex-1 overflow-hidden">
				<VaultSidebar tree={tree} gitHubBase={gitHubBase} />
				<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
					{children}
				</div>
			</div>
		</VaultShellProvider>
	);
}
