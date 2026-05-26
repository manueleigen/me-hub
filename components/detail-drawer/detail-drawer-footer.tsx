"use client";

import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DetailDrawerFooterProps = {
	onClose: () => void;
	onSave?: () => void;
	onDelete?: () => void;
	saving?: boolean;
	isDirty?: boolean;
	writeEnabled?: boolean;
	deleteLabel?: string;
};

export function DetailDrawerFooter({
	onClose,
	onSave,
	onDelete,
	saving = false,
	isDirty = false,
	writeEnabled = true,
	deleteLabel = "Löschen",
}: DetailDrawerFooterProps) {
	return (
		<>
			{onDelete && writeEnabled ? (
				<Button
					type="button"
					variant="outline"
					className="text-destructive hover:text-destructive"
					onClick={onDelete}
					disabled={saving}
				>
					<Trash2 className="mr-2 size-4" />
					{deleteLabel}
				</Button>
			) : (
				<div />
			)}
			<div className="flex gap-2">
				<Button type="button" variant="outline" onClick={onClose}>
					Schließen
				</Button>
				{writeEnabled && onSave ? (
					<Button
						type="button"
						disabled={saving || !isDirty}
						onClick={() => void onSave()}
					>
						<Save className="mr-2 size-4" />
						{saving ? "Speichern…" : "Speichern"}
					</Button>
				) : null}
			</div>
		</>
	);
}
