import type { Metadata } from "next";
import { listAdminRoles } from "@/app/actions/admin-roles";
import { AppHeader } from "@/components/layout/app-header";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata(["Admin", "Rollen"]);
import { AdminRolesClient } from "@/components/admin/admin-roles-client";

export default async function AdminRolesPage() {
	const roles = await listAdminRoles();

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Admin" }, { label: "Rollen" }]} />
			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-3xl space-y-6">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Rollen & Rechte</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							Rollen definieren, welche Plattform-Funktionen Nutzer nutzen dürfen. Standardnutzer
							erhalten bei der Registrierung einen Workspace, dürfen aber keine weiteren anlegen.
						</p>
					</div>
					<AdminRolesClient roles={roles} />
				</div>
			</div>
		</>
	);
}
