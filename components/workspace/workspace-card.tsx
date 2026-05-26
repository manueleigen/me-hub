"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutGrid, ArrowRight, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { updateWorkspaceSettings, deleteWorkspace } from "@/app/actions/workspace-settings";

type WorkspaceCardProps = {
	id: string;
	slug: string;
	name: string;
	type: "PERSONAL" | "TEAM";
	role: string;
};

export function WorkspaceCard({ id, slug, name, type, role }: WorkspaceCardProps) {
	const router = useRouter();
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState(name);
	const [isPending, startTransition] = useTransition();

	const canEdit = role === "OWNER" || role === "ADMIN";

	const handleSave = () => {
		if (!editName.trim() || editName.trim() === name) {
			setEditing(false);
			setEditName(name);
			return;
		}
		startTransition(async () => {
			try {
				await updateWorkspaceSettings(id, { name: editName.trim() });
				toast.success("Workspace umbenannt.");
				setEditing(false);
				router.refresh();
			} catch {
				toast.error("Fehler beim Speichern.");
			}
		});
	};

	const handleCancel = () => {
		setEditing(false);
		setEditName(name);
	};

	const handleDelete = () => {
		startTransition(async () => {
			const result = await deleteWorkspace(id);
			if (result.error) {
				toast.error(result.error);
			} else {
				toast.success("Workspace gelöscht.");
				router.refresh();
			}
		});
	};

	return (
		<Card className="transition-colors">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<LayoutGrid className="size-5 text-muted-foreground shrink-0" />

						{editing ? (
							<Input
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSave();
									if (e.key === "Escape") handleCancel();
								}}
								className="h-8 text-sm font-medium"
								autoFocus
								disabled={isPending}
							/>
						) : (
							<CardTitle className="text-base truncate">{name}</CardTitle>
						)}
					</div>

					<div className="flex items-center gap-2 shrink-0">
						{!editing && (
							<>
								<Badge variant="outline" className="text-xs capitalize">
									{role.toLowerCase()}
								</Badge>
							</>
						)}

						{canEdit && editing && (
							<>
								<Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={isPending}>
									{isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
								</Button>
								<Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel} disabled={isPending}>
									<X className="size-3" />
								</Button>
							</>
						)}

						{canEdit && !editing && (
							<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
								<Pencil className="size-3" />
							</Button>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-0 flex items-center justify-between">
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="sm" asChild className="gap-2">
						<Link href={`/w/${slug}`}>
							Öffnen
							<ArrowRight className="size-4" />
						</Link>
					</Button>
					<Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground">
						<Link href={`/w/${slug}/settings/general`}>
							Einstellungen
						</Link>
					</Button>
				</div>

				{role === "OWNER" && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" disabled={isPending}>
								<Trash2 className="size-3" />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Workspace löschen?</AlertDialogTitle>
								<AlertDialogDescription>
									<strong>{name}</strong> wird dauerhaft gelöscht. Alle Seiten und Konfigurationen werden entfernt. Vault-Dateien in GitHub bleiben unberührt.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Abbrechen</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDelete}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Löschen
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</CardContent>
		</Card>
	);
}
