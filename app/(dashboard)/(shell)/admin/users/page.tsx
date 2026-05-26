import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { listAdminUsers } from "@/app/actions/admin-users";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata(["Admin", "Nutzer"]);
import { listAdminRoles } from "@/app/actions/admin-roles";
import { AppHeader } from "@/components/layout/app-header";
import { AdminUsersClient } from "@/components/admin/admin-users-client";

export default async function AdminUsersPage() {
	const session = await getAuthSession();
	const [users, roles] = await Promise.all([listAdminUsers(), listAdminRoles()]);

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Admin" }, { label: "Nutzer" }]} />
			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-5xl space-y-6">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Nutzer</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							Alle registrierten Nutzer, Rollen zuweisen, sperren oder entfernen.
						</p>
					</div>
					<AdminUsersClient
						users={users}
						roles={roles.map((r) => ({ id: r.id, key: r.key, label: r.label }))}
						currentUserId={session!.user!.id}
					/>
				</div>
			</div>
		</>
	);
}
