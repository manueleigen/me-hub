"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { WorkspacePageData } from "@/lib/workspace-context";
import {
	WORKSPACE_PAGE_TEMPLATES,
	getWorkspacePageTemplate,
} from "@/lib/workspace-page-templates";
import { pageSlugFromLabel } from "@/lib/workspace-page-slug";

export type PagePatch = {
	label?: string;
	slug?: string;
	templateKey?: string;
	config?: Record<string, unknown> | null;
	isEnabled?: boolean;
};

export function WorkspacePageCard({
	page,
	canEdit,
	disabled,
	dragHidden,
	dndReady = false,
	onPatch,
	onRemove,
	onToggleEnabled,
}: {
	page: WorkspacePageData;
	canEdit: boolean;
	disabled?: boolean;
	/** true while this card is shown in DragOverlay (list slot stays as placeholder) */
	dragHidden?: boolean;
	/** false during SSR / first paint — avoids dnd-kit aria-describedby hydration mismatch */
	dndReady?: boolean;
	onPatch: (patch: PagePatch) => void | Promise<void>;
	onRemove: () => void;
	onToggleEnabled: () => void;
}) {
	const [label, setLabel] = useState(page.label);
	const [templateKey, setTemplateKey] = useState(page.templateKey);
	const [dataFolder, setDataFolder] = useState(
		(page.config?.dataFolder as string | undefined) ?? "",
	);
	const [saving, setSaving] = useState(false);
	const pageRef = useRef(page);

	useEffect(() => {
		pageRef.current = page;
		setLabel(page.label);
		setTemplateKey(page.templateKey);
		setDataFolder((page.config?.dataFolder as string | undefined) ?? "");
	}, [page]);

	const buildConfig = (folder: string) => {
		const merged = { ...(pageRef.current.config ?? {}) };
		if (folder.trim()) merged.dataFolder = folder.trim();
		else delete merged.dataFolder;
		return Object.keys(merged).length > 0 ? merged : null;
	};

	const persist = (patch: PagePatch) => {
		setSaving(true);
		try {
			onPatch(patch);
		} finally {
			// Brief indicator — sync runs in background
			window.setTimeout(() => setSaving(false), 400);
		}
	};

	const debouncedPersist = useDebouncedCallback((patch: PagePatch) => {
		persist(patch);
	}, 500);

	const dndActive = canEdit && dndReady && !disabled;

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
	} = useSortable({
		id: `page:${page.id}`,
		disabled: !dndActive,
		animateLayoutChanges: () => false,
	});

	const style: React.CSSProperties | undefined = dndActive
		? {
				transform: CSS.Transform.toString(transform),
				transition,
			}
		: undefined;

	return (
		<Card
			ref={dndActive ? setNodeRef : undefined}
			style={style}
			className={cn(
				"touch-none",
				!page.isEnabled && "opacity-60",
				dragHidden && "opacity-0",
			)}
		>
			<CardContent className="p-3 space-y-3">
				<div className="flex items-start gap-2">
					{canEdit && (
						<button
							type="button"
							className="mt-1 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:opacity-40"
							{...(dndActive ? attributes : undefined)}
							{...(dndActive ? listeners : undefined)}
							disabled={disabled}
							aria-label="Seite verschieben"
						>
							<GripVertical className="size-4" />
						</button>
					)}
					<div className="flex-1 grid gap-3 sm:grid-cols-2">
						<div className="space-y-1">
							<Label className="text-xs">Bezeichnung</Label>
							<Input
								value={label}
								onChange={(e) => {
									const v = e.target.value;
									setLabel(v);
									debouncedPersist({ label: v });
								}}
								onBlur={() => {
									if (label !== pageRef.current.label) {
										const template = getWorkspacePageTemplate(pageRef.current.templateKey);
										persist({
											label,
											slug: pageSlugFromLabel(
												label,
												template?.defaultSlug ?? "page",
											),
										});
									}
								}}
								disabled={!canEdit || disabled}
								className="h-8 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">Seitenart</Label>
							<Select
								value={templateKey}
								onValueChange={(key) => {
									setTemplateKey(key);
									const template = getWorkspacePageTemplate(key);
									const folder = dataFolder || template?.defaultDataFolder || "";
									if (template && !dataFolder) setDataFolder(template.defaultDataFolder);
									persist({
										templateKey: key,
										config: buildConfig(folder),
									});
								}}
								disabled={!canEdit || disabled}
							>
								<SelectTrigger className="h-8 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{WORKSPACE_PAGE_TEMPLATES.map((t) => (
										<SelectItem key={t.templateKey} value={t.templateKey}>
											{t.defaultLabel}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1 sm:col-span-2">
							<Label className="text-xs">
								Datenordner{" "}
								<span className="text-muted-foreground">(optional)</span>
							</Label>
							<Input
								placeholder="z.B. clients/"
								value={dataFolder}
								onChange={(e) => {
									const v = e.target.value;
									setDataFolder(v);
									debouncedPersist({ config: buildConfig(v) });
								}}
								onBlur={() => {
									const current =
										(pageRef.current.config?.dataFolder as string | undefined) ?? "";
									if (dataFolder !== current) {
										persist({ config: buildConfig(dataFolder) });
									}
								}}
								disabled={!canEdit || disabled}
								className="h-8 text-sm"
							/>
						</div>
					</div>
					{canEdit && (
						<div className="flex items-center gap-1 shrink-0">
							{saving && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="h-8 w-8"
								onClick={onToggleEnabled}
								disabled={disabled}
							>
								{page.isEnabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
							</Button>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="h-8 w-8 text-destructive hover:text-destructive"
								onClick={onRemove}
								disabled={disabled}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
