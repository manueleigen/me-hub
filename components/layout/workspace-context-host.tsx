"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { resolveWorkspaceForUser, type ResolvedWorkspace } from "@/app/actions/workspaces";
import { WorkspaceProvider } from "@/lib/workspace-context";

const WORKSPACE_SLUG_FROM_PATH = /^\/w\/([^/]+)/;

type WorkspaceContextHostProps = {
	initial: ResolvedWorkspace | null;
	children: React.ReactNode;
};

/**
 * Keeps workspace context in sync with the URL on client navigations.
 * The dashboard shell (sidebar) sits above `w/[workspaceSlug]/layout`, so a
 * server-only provider in the parent layout would not re-resolve when only the
 * slug segment changes.
 */
export function WorkspaceContextHost({ initial, children }: WorkspaceContextHostProps) {
	const pathname = usePathname();
	const urlSlug = pathname.match(WORKSPACE_SLUG_FROM_PATH)?.[1] ?? null;
	const [resolved, setResolved] = React.useState(initial);

	React.useEffect(() => {
		setResolved(initial);
	}, [initial]);

	React.useEffect(() => {
		if (!urlSlug) return;
		if (resolved?.workspace.slug === urlSlug) return;

		let cancelled = false;
		void resolveWorkspaceForUser(urlSlug).then((next) => {
			if (!cancelled && next) setResolved(next);
		});

		return () => {
			cancelled = true;
		};
	}, [urlSlug, resolved?.workspace.slug]);

	if (!resolved) {
		return children;
	}

	return (
		<WorkspaceProvider
			key={resolved.workspace.id}
			workspace={resolved.workspace}
			membership={resolved.membership}
			allWorkspaces={resolved.allWorkspaces}
		>
			{children}
		</WorkspaceProvider>
	);
}
