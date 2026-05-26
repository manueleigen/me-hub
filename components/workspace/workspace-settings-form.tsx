"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateWorkspaceSettings } from "@/app/actions/workspace-settings";
import { Loader2 } from "lucide-react";

export function WorkspaceSettingsForm({
	workspaceId,
	name: initialName,
	canEdit,
}: {
	workspaceId: string;
	name: string;
	canEdit: boolean;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState(initialName);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canEdit) return;

		startTransition(async () => {
			try {
				await updateWorkspaceSettings(workspaceId, { name });
				toast.success("Einstellungen gespeichert.");
				router.refresh();
			} catch {
				toast.error("Fehler beim Speichern.");
			}
		});
	};

	return (
		<form onSubmit={handleSubmit}>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Allgemein</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="ws-name">Name</Label>
						<Input
							id="ws-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={!canEdit}
							readOnly={!canEdit}
							maxLength={64}
						/>
					</div>
					{canEdit && (
						<Button type="submit" disabled={isPending}>
							{isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
							Speichern
						</Button>
					)}
				</CardContent>
			</Card>
		</form>
	);
}
