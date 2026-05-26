import type { Metadata } from "next";
import { listAppInvitations } from "@/app/actions/invitations";
import { AppHeader } from "@/components/layout/app-header";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata(["Admin", "Einladungen"]);
import { AdminInvitationsClient } from "./admin-invitations-client";

export default async function AdminInvitationsPage() {
	const invitations = await listAppInvitations();

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Admin" }, { label: "Einladungen" }]} />
			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-2xl space-y-6">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Plattform-Einladungen</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							Erstelle Einladungslinks für neue Plattform-Nutzer (7 Tage gültig). E-Mail optional —
							ohne E-Mail gilt der Link für die erste Registrierung.
						</p>
					</div>
					<AdminInvitationsClient
						invitations={invitations.map((i) => ({
							id: i.id,
							token: i.token,
							email: i.email,
							status: i.status,
							expiresAt: i.expiresAt.toISOString(),
							createdAt: i.createdAt.toISOString(),
							createdBy: i.createdBy.name ?? i.createdBy.email,
						}))}
					/>
				</div>
			</div>
		</>
	);
}
