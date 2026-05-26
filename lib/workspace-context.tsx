"use client";

import * as React from "react";

export type WorkspaceNavSectionData = {
	id: string;
	title: string | null;
	order: number;
};

export type WorkspacePageData = {
	id: string;
	templateKey: string;
	slug: string;
	label: string;
	icon: string | null;
	order: number;
	isEnabled: boolean;
	navSectionId: string | null;
	config: Record<string, unknown> | null;
};

export type WorkspaceData = {
	id: string;
	slug: string;
	name: string;
	type: "PERSONAL" | "TEAM";
	githubSync: boolean;
	vaultGithubOwner: string | null;
	vaultGithubRepo: string | null;
	vaultGithubBranch: string | null;
	initialSyncCompleted: boolean;
	navSections: WorkspaceNavSectionData[];
	pages: WorkspacePageData[];
};

export type WorkspaceSummary = {
	id: string;
	slug: string;
	name: string;
	type: "PERSONAL" | "TEAM";
};

export type WorkspaceMembership = {
	role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
};

type WorkspaceContextValue = {
	workspace: WorkspaceData;
	membership: WorkspaceMembership;
	allWorkspaces: WorkspaceSummary[];
};

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
	workspace,
	membership,
	allWorkspaces,
	children,
}: WorkspaceContextValue & { children: React.ReactNode }) {
	const value = React.useMemo(
		() => ({ workspace, membership, allWorkspaces }),
		[workspace, membership, allWorkspaces],
	);
	return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

/** Returns the active workspace context, or null when outside a workspace route. */
export function useWorkspace(): WorkspaceContextValue | null {
	return React.useContext(WorkspaceContext);
}

/** Returns the active workspace, throwing if called outside a workspace route. */
export function useRequiredWorkspace(): WorkspaceContextValue {
	const ctx = React.useContext(WorkspaceContext);
	if (!ctx) throw new Error("useRequiredWorkspace must be used inside a workspace route.");
	return ctx;
}
