import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata("Workspace-Einladung");
import {
	acceptWorkspaceInvitation,
	validateWorkspaceInvitationToken,
} from "@/app/actions/invitations";
import { getAuthSession } from "@/lib/auth";
import { WorkspaceInviteClient } from "./workspace-invite-client";

function InvalidInvitation({ message }: { message: string }) {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="text-center space-y-3 max-w-sm">
				<h1 className="text-xl font-bold">Einladung ungültig</h1>
				<p className="text-muted-foreground text-sm">{message}</p>
				<Link href="/login" className="text-sm underline">
					Zur Anmeldung
				</Link>
			</div>
		</div>
	);
}

export default async function WorkspaceInvitePage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;
	const trimmed = token.trim();

	const validation = await validateWorkspaceInvitationToken(trimmed);
	if (!validation.valid) {
		return <InvalidInvitation message={validation.error} />;
	}

	const session = await getAuthSession();
	if (session?.user?.id) {
		const result = await acceptWorkspaceInvitation(trimmed);
		if (result.success && result.workspaceSlug) {
			redirect(`/w/${result.workspaceSlug}`);
		}
		return <InvalidInvitation message={result.error ?? "Einladung konnte nicht angenommen werden."} />;
	}

	return (
		<WorkspaceInviteClient
			token={trimmed}
			workspaceName={validation.workspaceName}
			allowsSignup={validation.allowsSignup}
		/>
	);
}
