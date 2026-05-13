"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSync } from "@/lib/vault/sync-context";

export function SyncIndicator() {
	const { pending, lastSavedAt } = useSync();
	const [showSaved, setShowSaved] = React.useState(false);

	React.useEffect(() => {
		if (lastSavedAt === null || pending > 0) return;
		setShowSaved(true);
		const t = setTimeout(() => setShowSaved(false), 2500);
		return () => clearTimeout(t);
	}, [lastSavedAt, pending]);

	const visible = pending > 0 || showSaved;

	return (
		<div
			className={cn(
				"fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm shadow-md transition-all duration-300",
				visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
			)}
		>
			{pending > 0 ? (
				<>
					<Loader2 className="size-3.5 animate-spin text-muted-foreground" />
					<span className="text-muted-foreground">Speichern…</span>
				</>
			) : (
				<>
					<Check className="size-3.5 text-green-500" />
					<span className="text-muted-foreground">Gespeichert</span>
				</>
			)}
		</div>
	);
}
