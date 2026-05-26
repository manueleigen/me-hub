"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Loader2, User, Copy, UserMinus, Link2, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	updateWorkspaceMemberRole,
	removeWorkspaceMember,
	createWorkspaceInvitation,
	revokeWorkspaceInvitation,
	type WorkspaceInvitationLinkType,
} from "@/app/actions/workspace-settings";
import type { WorkspaceMembership } from "@/lib/workspace-context";

type Member = {
	userId: string;
	name: string | null;
	email: string;
	image: string | null;
	role: WorkspaceMembership["role"];
	joinedAt: string;
};

export type PendingWorkspaceInvitation = {
	id: string;
	token: string;
	role: string;
	allowsSignup: boolean;
	email: string | null;
	expiresAt: string;
	createdAt: string;
	invitedBy: string;
};

const ROLE_LABELS: Record<string, string> = {
	OWNER: "Inhaber",
	ADMIN: "Admin",
	MEMBER: "Mitglied",
	VIEWER: "Betrachter",
};

function MemberRow({
	member,
	workspaceId,
	currentUserRole,
	canManage,
	onChanged,
}: {
	member: Member;
	workspaceId: string;
	currentUserRole: WorkspaceMembership["role"];
	canManage: boolean;
	onChanged: () => void;
}) {
	const [isPending, startTransition] = useTransition();

	const canChangeRole =
		canManage &&
		member.role !== "OWNER" &&
		!(currentUserRole === "ADMIN" && member.role === "ADMIN");

	const changeRole = (newRole: string) => {
		startTransition(async () => {
			try {
				await updateWorkspaceMemberRole(
					workspaceId,
					member.userId,
					newRole as "ADMIN" | "MEMBER" | "VIEWER",
				);
				toast.success("Rolle aktualisiert.");
				onChanged();
			} catch (e) {
				toast.error((e as Error).message);
			}
		});
	};

	const removeMember = () => {
		startTransition(async () => {
			try {
				await removeWorkspaceMember(workspaceId, member.userId);
				toast.success("Mitglied entfernt.");
				onChanged();
			} catch (e) {
				toast.error((e as Error).message);
			}
		});
	};

	const joinedLabel = new Date(member.joinedAt).toLocaleDateString("de-DE", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

	return (
		<div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 border-b last:border-0">
			<div className="size-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
				{member.image ? (
					<Image src={member.image} width={36} height={36} alt="" className="size-full object-cover" />
				) : (
					<User className="size-4 text-muted-foreground" />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium truncate">{member.name || member.email}</p>
				<p className="text-xs text-muted-foreground truncate">
					{member.name ? member.email : null}
					{member.name ? " · " : ""}
					Beitritt {joinedLabel}
				</p>
			</div>

			{canChangeRole ? (
				<Select value={member.role} onValueChange={changeRole} disabled={isPending}>
					<SelectTrigger className="w-32 h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ADMIN">Admin</SelectItem>
						<SelectItem value="MEMBER">Mitglied</SelectItem>
						<SelectItem value="VIEWER">Betrachter</SelectItem>
					</SelectContent>
				</Select>
			) : (
				<Badge variant="outline" className="text-xs shrink-0">
					{ROLE_LABELS[member.role] ?? member.role}
				</Badge>
			)}

			{canManage && member.role !== "OWNER" && canChangeRole && (
				<Button
					size="icon"
					variant="ghost"
					className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
					onClick={removeMember}
					disabled={isPending}
					title="Mitglied entfernen"
				>
					{isPending ? <Loader2 className="size-4 animate-spin" /> : <UserMinus className="size-4" />}
				</Button>
			)}
		</div>
	);
}

function inviteUrl(token: string) {
	return `${typeof window !== "undefined" ? window.location.origin : ""}/workspace-invite/${token}`;
}

const LINK_TYPE_LABELS: Record<WorkspaceInvitationLinkType, string> = {
	member: "Bestehende Nutzer",
	member_with_signup: "Mit Registrierung",
};

function InviteLinkGenerator({
	workspaceId,
	canCreateMemberLink,
	canCreateSignupLink,
	onChanged,
}: {
	workspaceId: string;
	canCreateMemberLink: boolean;
	canCreateSignupLink: boolean;
	onChanged: () => void;
}) {
	const [isPending, startTransition] = useTransition();

	if (!canCreateMemberLink && !canCreateSignupLink) {
		return (
			<div className="rounded-lg border border-dashed bg-muted/20 p-4">
				<p className="text-sm text-muted-foreground">
					Du hast keine Berechtigung, Einladungslinks für diesen Workspace zu erstellen.
				</p>
			</div>
		);
	}

	const generate = (linkType: WorkspaceInvitationLinkType) => {
		startTransition(async () => {
			try {
				await createWorkspaceInvitation(workspaceId, { linkType, role: "MEMBER" });
				toast.success("Einladungslink erstellt.");
				onChanged();
			} catch (e) {
				toast.error((e as Error).message || "Fehler beim Erstellen der Einladung.");
			}
		});
	};

	return (
		<div className="rounded-lg border bg-muted/30 p-4 space-y-4">
			<div className="flex items-start gap-2">
				<Link2 className="size-4 mt-0.5 text-muted-foreground shrink-0" />
				<div className="space-y-1 min-w-0">
					<p className="text-sm font-medium">Einladungslinks</p>
					<p className="text-xs text-muted-foreground">
						Einmalige Links, 7 Tage gültig. Wähle den passenden Typ — Registrierung ist nur mit
						entsprechender Plattform-Berechtigung möglich.
					</p>
				</div>
			</div>

			{canCreateMemberLink && (
				<div className="space-y-2 rounded-md border bg-background p-3">
					<p className="text-sm font-medium">Workspace-Einladung</p>
					<p className="text-xs text-muted-foreground">
						Für Nutzer mit bestehendem App-Konto. Anmeldung per GitHub — keine neue Registrierung.
					</p>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => generate("member")}
						disabled={isPending}
					>
						{isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
						Link für bestehende Nutzer
					</Button>
				</div>
			)}

			{canCreateSignupLink && (
				<div className="space-y-2 rounded-md border bg-background p-3">
					<p className="text-sm font-medium">Einladung inkl. Registrierung</p>
					<p className="text-xs text-muted-foreground">
						Neue Nutzer können sich per GitHub registrieren und werden dem Workspace hinzugefügt.
						Bestehende Nutzer werden wie gewohnt nur beigetreten.
					</p>
					<Button size="sm" onClick={() => generate("member_with_signup")} disabled={isPending}>
						{isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
						Link mit Registrierung
					</Button>
				</div>
			)}
		</div>
	);
}

function ActiveInvitationsList({
	workspaceId,
	invitations,
	onChanged,
}: {
	workspaceId: string;
	invitations: PendingWorkspaceInvitation[];
	onChanged: () => void;
}) {
	const [isPending, startTransition] = useTransition();
	const [copiedId, setCopiedId] = useState<string | null>(null);

	if (invitations.length === 0) return null;

	const copyLink = (inv: PendingWorkspaceInvitation) => {
		void navigator.clipboard.writeText(inviteUrl(inv.token));
		setCopiedId(inv.id);
		toast.success("Link kopiert.");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const revoke = (invitationId: string) => {
		startTransition(async () => {
			try {
				await revokeWorkspaceInvitation(workspaceId, invitationId);
				toast.success("Einladung widerrufen.");
				onChanged();
			} catch (e) {
				toast.error((e as Error).message);
			}
		});
	};

	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">Aktive Einladungslinks ({invitations.length})</p>
			<ul className="space-y-2">
				{invitations.map((inv) => {
					const expiresLabel = new Date(inv.expiresAt).toLocaleDateString("de-DE", {
						day: "numeric",
						month: "short",
						year: "numeric",
					});
					const createdLabel = new Date(inv.createdAt).toLocaleDateString("de-DE", {
						day: "numeric",
						month: "short",
					});

					return (
						<li
							key={inv.id}
							className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center"
						>
							<div className="flex-1 min-w-0 space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant="secondary" className="text-xs">
										{ROLE_LABELS[inv.role] ?? inv.role}
									</Badge>
									<Badge variant="outline" className="text-xs">
										{inv.allowsSignup
											? LINK_TYPE_LABELS.member_with_signup
											: LINK_TYPE_LABELS.member}
									</Badge>
									<span className="text-xs text-muted-foreground">
										Erstellt {createdLabel} · läuft ab {expiresLabel}
									</span>
								</div>
								<p className="text-xs text-muted-foreground truncate">
									von {inv.invitedBy}
									{inv.email ? ` · ${inv.email}` : ""}
								</p>
								<p className="text-xs font-mono text-muted-foreground break-all">
									{inviteUrl(inv.token)}
								</p>
							</div>
							<div className="flex gap-1 shrink-0">
								<Button
									size="sm"
									variant="outline"
									onClick={() => copyLink(inv)}
									disabled={isPending}
								>
									{copiedId === inv.id ? (
										<span className="text-xs">✓</span>
									) : (
										<Copy className="size-4" />
									)}
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="text-destructive hover:text-destructive"
									onClick={() => revoke(inv.id)}
									disabled={isPending}
									title="Einladung widerrufen"
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export function WorkspaceMembersManager({
	workspaceId,
	workspaceSlug: _workspaceSlug,
	members,
	pendingInvitations = [],
	currentUserRole,
	canManage,
	canCreateMemberLink = false,
	canCreateSignupLink = false,
}: {
	workspaceId: string;
	workspaceSlug: string;
	members: Member[];
	pendingInvitations?: PendingWorkspaceInvitation[];
	currentUserRole: WorkspaceMembership["role"];
	canManage: boolean;
	canCreateMemberLink?: boolean;
	canCreateSignupLink?: boolean;
}) {
	const router = useRouter();
	const refresh = () => router.refresh();

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<Users className="size-4 text-muted-foreground" />
					<CardTitle className="text-base">
						{members.length} {members.length === 1 ? "Nutzer" : "Nutzer"}
					</CardTitle>
				</div>
				<CardDescription>
					{canManage
						? canCreateMemberLink || canCreateSignupLink
							? "Rollen anpassen, Mitglieder entfernen oder Einladungslinks erstellen."
							: "Rollen anpassen oder Mitglieder entfernen. Einladungslinks erfordern Plattform-Berechtigungen."
						: "Du siehst alle Mitglieder dieses Workspaces."}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{canManage && (canCreateMemberLink || canCreateSignupLink) ? (
					<InviteLinkGenerator
						workspaceId={workspaceId}
						canCreateMemberLink={canCreateMemberLink}
						canCreateSignupLink={canCreateSignupLink}
						onChanged={refresh}
					/>
				) : canManage ? (
					<div className="rounded-lg border border-dashed bg-muted/20 p-4">
						<p className="text-sm text-muted-foreground">
							Keine Berechtigung für Einladungslinks. Bitte einen Administrator um die Rechte
							„Workspace-Einladungen“ oder „Einladungen erstellen“.
						</p>
					</div>
				) : null}
				{canManage && pendingInvitations.length > 0 && (
					<ActiveInvitationsList
						workspaceId={workspaceId}
						invitations={pendingInvitations}
						onChanged={refresh}
					/>
				)}

				{members.length === 0 ? (
					<p className="text-sm text-muted-foreground py-2">Noch keine Mitglieder.</p>
				) : (
					<div>
						{members.map((m) => (
							<MemberRow
								key={m.userId}
								member={m}
								workspaceId={workspaceId}
								currentUserRole={currentUserRole}
								canManage={canManage}
								onChanged={refresh}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
