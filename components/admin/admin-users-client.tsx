"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban, Loader2, Trash2, UserCheck } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AdminUserRow } from "@/app/actions/admin-users";
import {
	deletePlatformUser,
	setUserBanned,
	updateUserAppRole,
} from "@/app/actions/admin-users";
import type { AdminRoleRow } from "@/app/actions/admin-roles";

type Props = {
	users: AdminUserRow[];
	roles: Pick<AdminRoleRow, "id" | "key" | "label">[];
	currentUserId: string;
};

export function AdminUsersClient({ users: initial, roles, currentUserId }: Props) {
	const [users, setUsers] = useState(initial);
	const [isPending, startTransition] = useTransition();

	const handleRoleChange = (userId: string, appRoleId: string) => {
		startTransition(async () => {
			try {
				await updateUserAppRole(userId, appRoleId);
				const role = roles.find((r) => r.id === appRoleId);
				setUsers((prev) =>
					prev.map((u) =>
						u.id === userId
							? {
									...u,
									appRoleId,
									appRoleKey: role?.key ?? null,
									appRoleLabel: role?.label ?? null,
								}
							: u,
					),
				);
				toast.success("Rolle aktualisiert.");
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Fehler beim Speichern.");
			}
		});
	};

	const handleBanToggle = (userId: string, banned: boolean) => {
		startTransition(async () => {
			try {
				await setUserBanned(userId, banned);
				setUsers((prev) =>
					prev.map((u) =>
						u.id === userId
							? {
									...u,
									banned,
									banReason: banned ? "Gesperrt durch Administrator" : null,
								}
							: u,
					),
				);
				toast.success(banned ? "Nutzer gesperrt." : "Sperre aufgehoben.");
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Fehler.");
			}
		});
	};

	const handleDelete = (userId: string) => {
		startTransition(async () => {
			try {
				await deletePlatformUser(userId);
				setUsers((prev) => prev.filter((u) => u.id !== userId));
				toast.success("Nutzer gelöscht.");
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Fehler beim Löschen.");
			}
		});
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nutzer</TableHead>
						<TableHead>Rolle</TableHead>
						<TableHead>Workspaces</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">Aktionen</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => {
						const isSelf = user.id === currentUserId;
						return (
							<TableRow key={user.id}>
								<TableCell>
									<div className="flex items-center gap-3">
										<div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
											{user.image ? (
												<Image
													src={user.image}
													alt=""
													width={32}
													height={32}
													className="size-8 object-cover"
												/>
											) : (
												<span className="text-xs font-medium">
													{(user.name ?? user.email).slice(0, 1).toUpperCase()}
												</span>
											)}
										</div>
										<div className="min-w-0">
											<p className="truncate font-medium">{user.name ?? "—"}</p>
											<p className="truncate text-muted-foreground text-xs">
												{user.email}
											</p>
										</div>
									</div>
								</TableCell>
								<TableCell>
									{isSelf ? (
										<Badge variant="secondary">{user.appRoleLabel ?? "—"}</Badge>
									) : (
										<Select
											value={user.appRoleId ?? undefined}
											onValueChange={(v) => handleRoleChange(user.id, v)}
											disabled={isPending}
										>
											<SelectTrigger className="w-[160px]">
												<SelectValue placeholder="Rolle wählen" />
											</SelectTrigger>
											<SelectContent>
												{roles.map((r) => (
													<SelectItem key={r.id} value={r.id}>
														{r.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								</TableCell>
								<TableCell>{user.workspaceCount}</TableCell>
								<TableCell>
									{user.banned ? (
										<Badge variant="destructive">Gesperrt</Badge>
									) : (
										<Badge variant="outline">Aktiv</Badge>
									)}
								</TableCell>
								<TableCell className="text-right">
									{isSelf ? (
										<span className="text-muted-foreground text-xs">Du</span>
									) : (
										<div className="flex justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												disabled={isPending}
												title={user.banned ? "Entsperren" : "Sperren"}
												onClick={() => handleBanToggle(user.id, !user.banned)}
											>
												{user.banned ? (
													<UserCheck className="size-4" />
												) : (
													<Ban className="size-4" />
												)}
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														disabled={isPending}
														title="Löschen"
													>
														{isPending ? (
															<Loader2 className="size-4 animate-spin" />
														) : (
															<Trash2 className="size-4 text-destructive" />
														)}
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Nutzer löschen?</AlertDialogTitle>
														<AlertDialogDescription>
															{user.email} und alle zugehörigen Daten werden
															unwiderruflich entfernt.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Abbrechen</AlertDialogCancel>
														<AlertDialogAction
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
															onClick={() => handleDelete(user.id)}
														>
															Löschen
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
