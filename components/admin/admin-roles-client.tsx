"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import {
	PLATFORM_PERMISSION_KEYS,
	PLATFORM_PERMISSION_META,
} from "@/lib/platform-permissions";
import type { AdminRoleRow } from "@/app/actions/admin-roles";
import { createAppRole, deleteAppRole, updateAppRole } from "@/app/actions/admin-roles";

type Props = {
	roles: AdminRoleRow[];
};

type RoleFormState = {
	label: string;
	key: string;
	description: string;
	permissions: string[];
};

const emptyForm = (): RoleFormState => ({
	label: "",
	key: "",
	description: "",
	permissions: [],
});

export function AdminRolesClient({ roles: initial }: Props) {
	const [roles, setRoles] = useState(initial);
	const [isPending, startTransition] = useTransition();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<RoleFormState>(emptyForm);

	const openCreate = () => {
		setEditingId(null);
		setForm(emptyForm());
		setDialogOpen(true);
	};

	const openEdit = (role: AdminRoleRow) => {
		setEditingId(role.id);
		setForm({
			label: role.label,
			key: role.key,
			description: role.description ?? "",
			permissions: [...role.permissions],
		});
		setDialogOpen(true);
	};

	const togglePermission = (key: string) => {
		setForm((f) => ({
			...f,
			permissions: f.permissions.includes(key)
				? f.permissions.filter((p) => p !== key)
				: [...f.permissions, key],
		}));
	};

	const handleSave = () => {
		startTransition(async () => {
			try {
				if (editingId) {
					await updateAppRole(editingId, {
						label: form.label,
						description: form.description,
						permissions: form.permissions,
					});
					setRoles((prev) =>
						prev.map((r) =>
							r.id === editingId
								? {
										...r,
										label: form.label.trim(),
										description: form.description.trim() || null,
										permissions: form.permissions,
									}
								: r,
						),
					);
					toast.success("Rolle gespeichert.");
				} else {
					const id = await createAppRole({
						label: form.label,
						key: form.key || undefined,
						description: form.description,
						permissions: form.permissions,
					});
					setRoles((prev) => [
						...prev,
						{
							id,
							key: form.key || form.label.toLowerCase(),
							label: form.label.trim(),
							description: form.description.trim() || null,
							permissions: form.permissions,
							isSystem: false,
							userCount: 0,
						},
					]);
					toast.success("Rolle erstellt.");
				}
				setDialogOpen(false);
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Fehler beim Speichern.");
			}
		});
	};

	const handleDelete = (roleId: string) => {
		startTransition(async () => {
			try {
				await deleteAppRole(roleId);
				setRoles((prev) => prev.filter((r) => r.id !== roleId));
				toast.success("Rolle gelöscht.");
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Fehler beim Löschen.");
			}
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-end">
				<Button onClick={openCreate} disabled={isPending}>
					<Plus className="mr-2 size-4" />
					Neue Rolle
				</Button>
			</div>

			<div className="grid gap-4">
				{roles.map((role) => (
					<Card key={role.id}>
						<CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
							<div>
								<CardTitle className="flex items-center gap-2 text-base">
									{role.label}
									{role.isSystem && (
										<Badge variant="secondary" className="text-xs">
											System
										</Badge>
									)}
								</CardTitle>
								<CardDescription className="font-mono text-xs">
									{role.key} · {role.userCount} Nutzer
								</CardDescription>
							</div>
							<div className="flex gap-1">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => openEdit(role)}
									disabled={isPending}
								>
									<Pencil className="size-4" />
								</Button>
								{!role.isSystem && (
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="ghost" size="icon" disabled={isPending}>
												<Trash2 className="size-4 text-destructive" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Rolle „{role.label}" löschen?</AlertDialogTitle>
												<AlertDialogDescription>
													Nur möglich, wenn kein Nutzer diese Rolle hat.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Abbrechen</AlertDialogCancel>
												<AlertDialogAction
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
													onClick={() => handleDelete(role.id)}
												>
													Löschen
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								)}
							</div>
						</CardHeader>
						<CardContent>
							{role.description && (
								<p className="text-muted-foreground mb-3 text-sm">{role.description}</p>
							)}
							<div className="flex flex-wrap gap-1.5">
								{role.permissions.length === 0 ? (
									<Badge variant="outline">Keine Zusatzrechte</Badge>
								) : (
									role.permissions.map((p) => (
										<Badge key={p} variant="outline">
											{PLATFORM_PERMISSION_META[p as keyof typeof PLATFORM_PERMISSION_META]
												?.label ?? p}
										</Badge>
									))
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingId ? "Rolle bearbeiten" : "Neue Rolle"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="role-label">Anzeigename</Label>
							<Input
								id="role-label"
								value={form.label}
								onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
								placeholder="z.B. Redakteur"
							/>
						</div>
						{!editingId && (
							<div className="space-y-2">
								<Label htmlFor="role-key">Schlüssel (optional)</Label>
								<Input
									id="role-key"
									value={form.key}
									onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
									placeholder="z.B. editor"
									className="font-mono text-sm"
								/>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="role-desc">Beschreibung</Label>
							<Textarea
								id="role-desc"
								value={form.description}
								onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
								rows={2}
							/>
						</div>
						<div className="space-y-3">
							<Label>Berechtigungen</Label>
							{PLATFORM_PERMISSION_KEYS.map((key) => {
								const meta = PLATFORM_PERMISSION_META[key];
								const checked = form.permissions.includes(key);
								return (
									<label
										key={key}
										className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
									>
										<Checkbox
											checked={checked}
											onCheckedChange={() => togglePermission(key)}
										/>
										<div>
											<p className="text-sm font-medium">{meta.label}</p>
											<p className="text-muted-foreground text-xs">{meta.description}</p>
										</div>
									</label>
								);
							})}
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							Abbrechen
						</Button>
						<Button onClick={handleSave} disabled={isPending || !form.label.trim()}>
							{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
							Speichern
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
