import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { resolveWorkspaceForUser, setActiveWorkspace } from "@/app/actions/workspaces";
import { createWorkspaceLayoutMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ workspaceSlug: string }>;
}): Promise<Metadata> {
	const { workspaceSlug } = await params;
	return createWorkspaceLayoutMetadata(workspaceSlug);
}

export default async function WorkspaceLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ workspaceSlug: string }>;
}) {
	const { workspaceSlug } = await params;
	const resolved = await resolveWorkspaceForUser(workspaceSlug);

	if (!resolved) {
		notFound();
	}

	after(() => setActiveWorkspace(resolved.workspace.id));

	return children;
}
