import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata("Workspaces");
import { prisma } from "@/lib/prisma";
import { canUserCreateWorkspaces, createWorkspace } from "@/app/actions/workspaces";
import { AppHeader } from "@/components/layout/app-header";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export default async function WorkspacesPage() {
	const session = await getAuthSession();
	if (!session?.user?.id) redirect("/login");

	const canCreate = await canUserCreateWorkspaces();

	const memberships = await prisma.workspaceMember.findMany({
		where: { userId: session.user.id },
		include: {
			workspace: {
				select: { id: true, slug: true, name: true, type: true, createdAt: true },
			},
		},
		orderBy: { joinedAt: "asc" },
	});

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Workspaces" }]} />
			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-2xl space-y-8">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Deine Workspaces</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							Verwalte und wechsle zwischen deinen Workspaces.
						</p>
					</div>

					{memberships.length > 0 && (
						<div className="grid gap-3">
							{memberships.map(({ workspace, role }) => (
								<WorkspaceCard
									key={workspace.id}
									id={workspace.id}
									slug={workspace.slug}
									name={workspace.name}
									type={workspace.type as "PERSONAL" | "TEAM"}
									role={role}
								/>
							))}
						</div>
					)}

					{canCreate ? (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<Plus className="size-4" />
									Neuen Workspace erstellen
								</CardTitle>
							</CardHeader>
							<CardContent>
								<form action={createWorkspace} className="flex gap-3">
									<div className="flex-1 space-y-1">
										<Label htmlFor="name" className="sr-only">
											Name
										</Label>
										<Input
											id="name"
											name="name"
											placeholder="z.B. Mein Workspace"
											required
											minLength={1}
											maxLength={64}
										/>
									</div>
									<Button type="submit">Erstellen</Button>
								</form>
							</CardContent>
						</Card>
					) : (
						<p className="text-muted-foreground text-sm">
							Weitere Workspaces können mit deiner aktuellen Rolle nicht angelegt werden. Bei
							Registrierung wurde bereits ein persönlicher Workspace erstellt.
						</p>
					)}
				</div>
			</div>
		</>
	);
}
