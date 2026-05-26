"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	closestCorners,
	useSensor,
	useSensors,
	useDroppable,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useBackgroundSave } from "@/hooks/use-background-save";
import {
	addWorkspaceNavSection,
	addWorkspacePage,
	deleteWorkspaceNavSection,
	removeWorkspacePage,
	reorderWorkspaceNavSections,
	reorderWorkspacePages,
	updateWorkspaceNavSection,
	updateWorkspacePage,
} from "@/app/actions/workspace-settings";
import type { WorkspaceNavSectionData, WorkspacePageData } from "@/lib/workspace-context";
import { WORKSPACE_PAGE_TEMPLATES } from "@/lib/workspace-page-templates";
import {
	WorkspacePageCard,
	type PagePatch,
} from "@/components/workspace/settings/pages/workspace-page-card";

const UNSECTIONED_ID = "__none__";

type BoardState = {
	sectionOrder: string[];
	sections: Record<string, WorkspaceNavSectionData>;
	pageIdsByContainer: Record<string, string[]>;
	pages: Record<string, WorkspacePageData>;
};

function initBoardState(
	sections: WorkspaceNavSectionData[],
	pages: WorkspacePageData[],
): BoardState {
	const sectionOrder = [...sections].sort((a, b) => a.order - b.order).map((s) => s.id);
	const sectionsMap = Object.fromEntries(sections.map((s) => [s.id, s]));
	const pageIdsByContainer: Record<string, string[]> = {
		[UNSECTIONED_ID]: [],
	};
	for (const id of sectionOrder) pageIdsByContainer[id] = [];

	const sortedPages = [...pages].sort((a, b) => a.order - b.order);
	for (const p of sortedPages) {
		const cid =
			p.navSectionId && pageIdsByContainer[p.navSectionId] !== undefined
				? p.navSectionId
				: UNSECTIONED_ID;
		pageIdsByContainer[cid].push(p.id);
	}

	return {
		sectionOrder,
		sections: sectionsMap,
		pageIdsByContainer,
		pages: Object.fromEntries(pages.map((p) => [p.id, p])),
	};
}

function flattenPageIds(state: BoardState): string[] {
	const ids: string[] = [...(state.pageIdsByContainer[UNSECTIONED_ID] ?? [])];
	for (const sid of state.sectionOrder) {
		ids.push(...(state.pageIdsByContainer[sid] ?? []));
	}
	return ids;
}

function findPageContainer(
	pageId: string,
	pageIdsByContainer: Record<string, string[]>,
): string | null {
	for (const [containerId, ids] of Object.entries(pageIdsByContainer)) {
		if (ids.includes(pageId)) return containerId;
	}
	return null;
}

function resolveDropContainer(
	overId: string,
	pageIdsByContainer: Record<string, string[]>,
): string | null {
	if (overId.startsWith("drop:")) return overId.slice(5);
	if (overId.startsWith("page:")) {
		return findPageContainer(overId.slice(5), pageIdsByContainer);
	}
	return null;
}

/** Syncs `navSectionId` on page records from container membership (optimistic sidebar). */
function withSyncedPageSections(
	prev: BoardState,
	pageIdsByContainer: Record<string, string[]>,
): BoardState {
	const pages = { ...prev.pages };
	for (const [containerId, ids] of Object.entries(pageIdsByContainer)) {
		const navSectionId = containerId === UNSECTIONED_ID ? null : containerId;
		for (const pageId of ids) {
			const page = pages[pageId];
			if (page && page.navSectionId !== navSectionId) {
				pages[pageId] = { ...page, navSectionId };
			}
		}
	}
	return { ...prev, pageIdsByContainer, pages };
}

function serverPropsKey(sections: WorkspaceNavSectionData[], pages: WorkspacePageData[]) {
	return JSON.stringify({ sections, pages });
}

function PageCardsList({
	pageIds,
	pages,
	canEdit,
	dndReady,
	disabled,
	dragHiddenPageId,
	onPagePatch,
	onPageRemove,
	onPageToggle,
}: {
	pageIds: string[];
	pages: Record<string, WorkspacePageData>;
	canEdit: boolean;
	dndReady: boolean;
	disabled?: boolean;
	dragHiddenPageId: string | null;
	onPagePatch: (pageId: string, patch: PagePatch) => void;
	onPageRemove: (pageId: string) => void;
	onPageToggle: (pageId: string, enabled: boolean) => void;
}) {
	return (
		<>
			{pageIds.map((pid) => {
				const page = pages[pid];
				if (!page) return null;
				return (
					<WorkspacePageCard
						key={pid}
						page={page}
						canEdit={canEdit}
						dndReady={dndReady}
						disabled={disabled}
						dragHidden={dragHiddenPageId === pid}
						onPatch={(patch) => onPagePatch(pid, patch)}
						onRemove={() => onPageRemove(pid)}
						onToggleEnabled={() => onPageToggle(pid, !page.isEnabled)}
					/>
				);
			})}
		</>
	);
}

function PagesDropArea({
	containerId,
	pageIds,
	canEdit,
	disabled,
	children,
}: {
	containerId: string;
	pageIds: string[];
	canEdit: boolean;
	disabled?: boolean;
	children: React.ReactNode;
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `drop:${containerId}`,
		disabled: !canEdit || disabled,
	});

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"min-h-[5rem] p-3 transition-colors rounded-b-xl",
				isOver && canEdit && "bg-primary/5 ring-2 ring-inset ring-primary/25",
			)}
		>
			<SortableContext
				items={pageIds.map((id) => `page:${id}`)}
				strategy={verticalListSortingStrategy}
			>
				<div className="space-y-2">{children}</div>
			</SortableContext>
			{pageIds.length === 0 && (
				<p className="text-center text-xs text-muted-foreground py-6 pointer-events-none">
					{canEdit ? "Seiten hierher ziehen" : "Keine Seiten"}
				</p>
			)}
		</div>
	);
}

function UnsectionedZone({
	pageIds,
	state,
	canEdit,
	dndReady,
	dragHiddenPageId,
	onPagePatch,
	onPageRemove,
	onPageToggle,
}: {
	pageIds: string[];
	state: BoardState;
	canEdit: boolean;
	dndReady: boolean;
	dragHiddenPageId: string | null;
	onPagePatch: (pageId: string, patch: PagePatch) => void;
	onPageRemove: (pageId: string) => void;
	onPageToggle: (pageId: string, enabled: boolean) => void;
}) {
	return (
		<div className="rounded-xl border bg-card/50">
			<div className="border-b px-3 py-2">
				<p className="text-xs font-medium text-muted-foreground">Ohne Bereich</p>
			</div>
			<PagesDropArea containerId={UNSECTIONED_ID} pageIds={pageIds} canEdit={canEdit}>
				<PageCardsList
					pageIds={pageIds}
					pages={state.pages}
					canEdit={canEdit}
					dndReady={dndReady}
					dragHiddenPageId={dragHiddenPageId}
					onPagePatch={onPagePatch}
					onPageRemove={onPageRemove}
					onPageToggle={onPageToggle}
				/>
			</PagesDropArea>
		</div>
	);
}

function SectionColumn({
	sectionId,
	state,
	canEdit,
	dndReady,
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
	onTitleChange,
	onDelete,
	dragHiddenPageId,
	onPagePatch,
	onPageRemove,
	onPageToggle,
}: {
	sectionId: string;
	state: BoardState;
	canEdit: boolean;
	dndReady: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onTitleChange: (sectionId: string, title: string) => void;
	onDelete: (sectionId: string) => void;
	dragHiddenPageId: string | null;
	onPagePatch: (pageId: string, patch: PagePatch) => void;
	onPageRemove: (pageId: string) => void;
	onPageToggle: (pageId: string, enabled: boolean) => void;
}) {
	const section = state.sections[sectionId];
	const pageIds = state.pageIdsByContainer[sectionId] ?? [];

	return (
		<div className="rounded-xl border bg-card/50">
			<div className="flex items-center gap-2 border-b px-3 py-2">
				{canEdit && (
					<div className="flex flex-col gap-0.5 shrink-0">
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="h-6 w-6"
							disabled={!canMoveUp}
							onClick={onMoveUp}
							aria-label="Bereich nach oben"
						>
							<ChevronUp className="size-3.5" />
						</Button>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="h-6 w-6"
							disabled={!canMoveDown}
							onClick={onMoveDown}
							aria-label="Bereich nach unten"
						>
							<ChevronDown className="size-3.5" />
						</Button>
					</div>
				)}
				<div className="flex-1 min-w-0">
					<Label className="text-xs text-muted-foreground">Bereichstitel (optional)</Label>
					<Input
						placeholder="z.B. Ideen — leer = ohne Überschrift"
						value={section?.title ?? ""}
						onChange={(e) => onTitleChange(sectionId, e.target.value)}
						disabled={!canEdit}
						className="h-8 text-sm border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
					/>
				</div>
				{canEdit && (
					<Button
						type="button"
						size="icon"
						variant="ghost"
						className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
						onClick={() => onDelete(sectionId)}
					>
						<Trash2 className="size-4" />
					</Button>
				)}
			</div>
			<PagesDropArea containerId={sectionId} pageIds={pageIds} canEdit={canEdit}>
				<PageCardsList
					pageIds={pageIds}
					pages={state.pages}
					canEdit={canEdit}
					dndReady={dndReady}
					dragHiddenPageId={dragHiddenPageId}
					onPagePatch={onPagePatch}
					onPageRemove={onPageRemove}
					onPageToggle={onPageToggle}
				/>
			</PagesDropArea>
		</div>
	);
}

function AddPageDialog({
	workspaceId,
	defaultContainerId,
	onAdded,
}: {
	workspaceId: string;
	defaultContainerId: string;
	onAdded: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [selectedTemplate, setSelectedTemplate] = useState<
		(typeof WORKSPACE_PAGE_TEMPLATES)[number] | null
	>(null);
	const [label, setLabel] = useState("");

	const handleAdd = () => {
		if (!selectedTemplate) return;
		startTransition(async () => {
			try {
				await addWorkspacePage(workspaceId, {
					templateKey: selectedTemplate.templateKey,
					slug: selectedTemplate.defaultSlug,
					label: label || selectedTemplate.defaultLabel,
					icon: selectedTemplate.defaultIcon,
					navSectionId: defaultContainerId === UNSECTIONED_ID ? null : defaultContainerId,
				});
				toast.success("Seite hinzugefügt.");
				setOpen(false);
				setSelectedTemplate(null);
				setLabel("");
				onAdded();
			} catch {
				toast.error("Fehler.");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button type="button" size="sm" variant="outline" className="gap-2">
					<Plus className="size-4" />
					Seite hinzufügen
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Seite hinzufügen</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-2">
					<div className="grid gap-2 max-h-48 overflow-y-auto">
						{WORKSPACE_PAGE_TEMPLATES.map((t) => (
							<button
								key={t.templateKey}
								type="button"
								onClick={() => {
									setSelectedTemplate(t);
									setLabel(t.defaultLabel);
								}}
								className={cn(
									"text-left p-3 rounded-lg border transition-colors",
									selectedTemplate?.templateKey === t.templateKey
										? "border-primary bg-primary/10"
										: "border-border hover:bg-accent",
								)}
							>
								<p className="text-sm font-medium">{t.defaultLabel}</p>
								<p className="text-xs text-muted-foreground">{t.templateKey}</p>
							</button>
						))}
					</div>
					{selectedTemplate && (
						<div className="space-y-2">
							<Label>Bezeichnung</Label>
							<Input value={label} onChange={(e) => setLabel(e.target.value)} />
						</div>
					)}
					<Button className="w-full" onClick={handleAdd} disabled={!selectedTemplate || isPending}>
						{isPending ? <Loader2 className="size-4 animate-spin" /> : "Hinzufügen"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function WorkspacePagesBoard({
	workspaceId,
	sections: initialSections,
	pages: initialPages,
	canEdit,
}: {
	workspaceId: string;
	sections: WorkspaceNavSectionData[];
	pages: WorkspacePageData[];
	canEdit: boolean;
}) {
	const router = useRouter();
	const backgroundSave = useBackgroundSave();
	const [dndReady, setDndReady] = useState(false);
	const [state, setState] = useState(() => initBoardState(initialSections, initialPages));
	const [activeDragId, setActiveDragId] = useState<string | null>(null);
	const [syncingLayout, setSyncingLayout] = useState(false);
	const [, startTransition] = useTransition();
	const initialPagesRef = useRef(initialPages);
	const initialSectionOrderRef = useRef(
		[...initialSections].sort((a, b) => a.order - b.order).map((s) => s.id),
	);
	const lastServerPropsKeyRef = useRef(serverPropsKey(initialSections, initialPages));
	const isDraggingRef = useRef(false);

	useEffect(() => {
		setDndReady(true);
	}, []);

	useEffect(() => {
		const nextKey = serverPropsKey(initialSections, initialPages);
		if (nextKey === lastServerPropsKeyRef.current) return;
		if (isDraggingRef.current || syncingLayout) return;

		lastServerPropsKeyRef.current = nextKey;
		initialPagesRef.current = initialPages;
		initialSectionOrderRef.current = [...initialSections]
			.sort((a, b) => a.order - b.order)
			.map((s) => s.id);
		setState(initBoardState(initialSections, initialPages));
	}, [initialSections, initialPages, syncingLayout]);

	const refreshSoon = useDebouncedCallback(() => router.refresh(), 400);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	/** Updates refs used for diffing the next save — does not touch lastServerPropsKeyRef. */
	const applySaveBaseline = useCallback((next: BoardState) => {
		const flatIds = flattenPageIds(next);
		initialPagesRef.current = flatIds
			.map((id) => next.pages[id])
			.filter((p): p is WorkspacePageData => Boolean(p));
		initialSectionOrderRef.current = [...next.sectionOrder];
	}, []);

	const commitLayoutToServer = useCallback(
		(next: BoardState, rollback: BoardState) => {
			const flatIds = flattenPageIds(next);
			const baselineById = Object.fromEntries(initialPagesRef.current.map((p) => [p.id, p]));

			backgroundSave(async () => {
				setSyncingLayout(true);
				try {
					await reorderWorkspacePages(workspaceId, flatIds);

					await Promise.all(
						flatIds.map((pageId) => {
							const container = findPageContainer(pageId, next.pageIdsByContainer);
							const navSectionId = container === UNSECTIONED_ID ? null : container;
							const baseline = baselineById[pageId];
							if (baseline && baseline.navSectionId !== navSectionId) {
								return updateWorkspacePage(workspaceId, pageId, { navSectionId });
							}
							return Promise.resolve();
						}),
					);

					if (next.sectionOrder.join() !== initialSectionOrderRef.current.join()) {
						await reorderWorkspaceNavSections(workspaceId, next.sectionOrder);
					}

					applySaveBaseline(next);
					refreshSoon();
				} catch {
					setState(rollback);
					applySaveBaseline(rollback);
					throw new Error("layout sync failed");
				} finally {
					setSyncingLayout(false);
				}
			});
		},
		[applySaveBaseline, backgroundSave, refreshSoon, workspaceId],
	);

	const clearDragOverlay = useCallback(() => {
		setActiveDragId(null);
		isDraggingRef.current = false;
	}, []);

	const handleDragStart = (event: DragStartEvent) => {
		isDraggingRef.current = true;
		setActiveDragId(String(event.active.id));
	};

	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;
		if (!over || !canEdit) return;

		const activeId = String(active.id);
		const overId = String(over.id);
		if (!activeId.startsWith("page:")) return;

		const activePageId = activeId.slice(5);

		setState((prev) => {
			const activeContainer = findPageContainer(activePageId, prev.pageIdsByContainer);
			const overContainer = resolveDropContainer(overId, prev.pageIdsByContainer);
			if (!activeContainer || !overContainer) return prev;

			let pageIdsByContainer = prev.pageIdsByContainer;

			if (activeContainer === overContainer) {
				const items = [...(prev.pageIdsByContainer[activeContainer] ?? [])];
				const activeIndex = items.indexOf(activePageId);
				const overIndex = overId.startsWith("page:")
					? items.indexOf(overId.slice(5))
					: items.length - 1;
				if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return prev;
				pageIdsByContainer = {
					...prev.pageIdsByContainer,
					[activeContainer]: arrayMove(items, activeIndex, overIndex),
				};
			} else {
				const activeItems = [...(prev.pageIdsByContainer[activeContainer] ?? [])];
				const overItems = [...(prev.pageIdsByContainer[overContainer] ?? [])];
				const activeIndex = activeItems.indexOf(activePageId);
				if (activeIndex < 0) return prev;

				activeItems.splice(activeIndex, 1);
				const overIndex = overId.startsWith("page:")
					? overItems.indexOf(overId.slice(5))
					: overItems.length;
				overItems.splice(overIndex >= 0 ? overIndex : overItems.length, 0, activePageId);

				pageIdsByContainer = {
					...prev.pageIdsByContainer,
					[activeContainer]: activeItems,
					[overContainer]: overItems,
				};
			}

			return withSyncedPageSections(prev, pageIdsByContainer);
		});
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		const activeId = String(active.id);

		if (activeId.startsWith("page:")) {
			flushSync(() => clearDragOverlay());
		} else {
			clearDragOverlay();
		}

		if (!over || !canEdit) return;
		if (!activeId.startsWith("page:")) return;

		let layoutCommit: { next: BoardState; rollback: BoardState } | null = null;
		setState((prev) => {
			const next = withSyncedPageSections(prev, prev.pageIdsByContainer);
			layoutCommit = { next, rollback: prev };
			return next;
		});
		if (layoutCommit) {
			commitLayoutToServer(layoutCommit.next, layoutCommit.rollback);
		}
	};

	const handleDragCancel = () => {
		flushSync(() => clearDragOverlay());
	};

	const moveSection = (sectionId: string, direction: -1 | 1) => {
		let layoutCommit: { next: BoardState; rollback: BoardState } | null = null;
		setState((prev) => {
			const index = prev.sectionOrder.indexOf(sectionId);
			const target = index + direction;
			if (index < 0 || target < 0 || target >= prev.sectionOrder.length) return prev;
			const next = {
				...prev,
				sectionOrder: arrayMove(prev.sectionOrder, index, target),
			};
			layoutCommit = { next, rollback: prev };
			return next;
		});
		if (layoutCommit) {
			commitLayoutToServer(layoutCommit.next, layoutCommit.rollback);
		}
	};

	const debouncedSectionTitlePersist = useDebouncedCallback(
		(sectionId: string, title: string | null, rollbackTitle: string | null) => {
			backgroundSave(async () => {
				try {
					await updateWorkspaceNavSection(workspaceId, sectionId, { title });
				} catch {
					setState((prev) => ({
						...prev,
						sections: {
							...prev.sections,
							[sectionId]: { ...prev.sections[sectionId]!, title: rollbackTitle },
						},
					}));
					throw new Error("section title sync failed");
				}
			});
		},
		500,
	);

	const handleSectionTitleChange = (sectionId: string, title: string) => {
		const rollbackTitle = state.sections[sectionId]?.title ?? null;
		const normalized = title.trim() || null;
		setState((prev) => ({
			...prev,
			sections: {
				...prev.sections,
				[sectionId]: { ...prev.sections[sectionId]!, title: normalized },
			},
		}));
		debouncedSectionTitlePersist(sectionId, normalized, rollbackTitle);
	};

	const applyPagePatchOptimistic = (pageId: string, patch: PagePatch) => {
		let rollback: WorkspacePageData | undefined;
		setState((prev) => {
			rollback = prev.pages[pageId];
			if (!rollback) return prev;
			return {
				...prev,
				pages: {
					...prev.pages,
					[pageId]: {
						...rollback,
						...patch,
						config: patch.config !== undefined ? patch.config : rollback.config,
					},
				},
			};
		});

		backgroundSave(async () => {
			try {
				await updateWorkspacePage(workspaceId, pageId, patch);
				if (rollback) {
					const updated = {
						...rollback,
						...patch,
						config: patch.config !== undefined ? patch.config : rollback.config,
					};
					initialPagesRef.current = initialPagesRef.current.map((p) =>
						p.id === pageId ? updated : p,
					);
				}
				refreshSoon();
			} catch {
				if (rollback) {
					setState((prev) => ({
						...prev,
						pages: { ...prev.pages, [pageId]: rollback! },
					}));
				}
				throw new Error("page patch sync failed");
			}
		});
	};

	const handlePagePatch = (pageId: string, patch: PagePatch) => {
		applyPagePatchOptimistic(pageId, patch);
	};

	const handlePageRemove = (pageId: string) => {
		startTransition(async () => {
			try {
				await removeWorkspacePage(workspaceId, pageId);
				toast.success("Seite entfernt.");
				router.refresh();
			} catch {
				toast.error("Fehler.");
			}
		});
	};

	const handlePageToggle = (pageId: string, enabled: boolean) => {
		applyPagePatchOptimistic(pageId, { isEnabled: enabled });
	};

	const handleDeleteSection = (sectionId: string) => {
		const rollback = state;
		const movedPageIds = state.pageIdsByContainer[sectionId] ?? [];

		setState((prev) => {
			const unsectioned = [
				...(prev.pageIdsByContainer[UNSECTIONED_ID] ?? []),
				...movedPageIds,
			];
			const { [sectionId]: _removed, ...restContainers } = prev.pageIdsByContainer;
			const pages = { ...prev.pages };
			for (const pageId of movedPageIds) {
				if (pages[pageId]) pages[pageId] = { ...pages[pageId], navSectionId: null };
			}
			const sections = { ...prev.sections };
			delete sections[sectionId];
			return {
				...prev,
				sectionOrder: prev.sectionOrder.filter((id) => id !== sectionId),
				sections,
				pageIdsByContainer: {
					...restContainers,
					[UNSECTIONED_ID]: unsectioned,
				},
				pages,
			};
		});

		backgroundSave(async () => {
			try {
				await deleteWorkspaceNavSection(workspaceId, sectionId);
				for (const pageId of movedPageIds) {
					const p = initialPagesRef.current.find((x) => x.id === pageId);
					if (p) p.navSectionId = null;
				}
				initialSectionOrderRef.current = rollback.sectionOrder.filter((id) => id !== sectionId);
				toast.success(
					movedPageIds.length > 0
						? `Bereich entfernt — ${movedPageIds.length} Seite(n) nach „Ohne Bereich“ verschoben.`
						: "Bereich entfernt.",
				);
				refreshSoon();
			} catch {
				setState(rollback);
				throw new Error("section delete failed");
			}
		});
	};

	const addSection = () => {
		startTransition(async () => {
			try {
				await addWorkspaceNavSection(workspaceId, { title: null });
				toast.success("Bereich hinzugefügt.");
				router.refresh();
			} catch {
				toast.error("Fehler beim Hinzufügen.");
			}
		});
	};

	const unsectionedIds = state.pageIdsByContainer[UNSECTIONED_ID] ?? [];
	const dragHiddenPageId = activeDragId?.startsWith("page:")
		? activeDragId.slice(5)
		: null;
	const overlayPage = dragHiddenPageId ? state.pages[dragHiddenPageId] : null;

	const board = (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm text-muted-foreground">
					Bereiche und Seiten per Drag &amp; Drop anordnen. Änderungen werden automatisch
					gespeichert.
				</p>
				{syncingLayout && (
					<span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
						<Loader2 className="size-3.5 animate-spin" />
						Synchronisiert…
					</span>
				)}
			</div>

			<UnsectionedZone
				pageIds={unsectionedIds}
				state={state}
				canEdit={canEdit}
				dndReady={dndReady}
				dragHiddenPageId={dragHiddenPageId}
				onPagePatch={handlePagePatch}
				onPageRemove={handlePageRemove}
				onPageToggle={handlePageToggle}
			/>

			<div className="space-y-4">
				{state.sectionOrder.map((sectionId, index) => (
					<SectionColumn
						key={sectionId}
						sectionId={sectionId}
						state={state}
						canEdit={canEdit}
						dndReady={dndReady}
						canMoveUp={index > 0}
						canMoveDown={index < state.sectionOrder.length - 1}
						onMoveUp={() => moveSection(sectionId, -1)}
						onMoveDown={() => moveSection(sectionId, 1)}
						onTitleChange={handleSectionTitleChange}
						onDelete={handleDeleteSection}
						dragHiddenPageId={dragHiddenPageId}
						onPagePatch={handlePagePatch}
						onPageRemove={handlePageRemove}
						onPageToggle={handlePageToggle}
					/>
				))}
			</div>

			{state.sectionOrder.length === 0 && unsectionedIds.length === 0 && (
				<p className="text-sm text-muted-foreground text-center py-8">
					Noch keine Bereiche oder Seiten.
				</p>
			)}

			{canEdit && (
				<div className="flex flex-wrap gap-2 pt-2">
					<Button type="button" size="sm" variant="outline" className="gap-2" onClick={addSection}>
						<Plus className="size-4" />
						Bereich hinzufügen
					</Button>
					<AddPageDialog
						workspaceId={workspaceId}
						defaultContainerId={
							state.sectionOrder[state.sectionOrder.length - 1] ?? UNSECTIONED_ID
						}
						onAdded={() => router.refresh()}
					/>
				</div>
			)}
		</div>
	);

	if (!canEdit) {
		return board;
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCorners}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			{board}
			{overlayPage ? (
				<DragOverlay dropAnimation={null} adjustScale={false}>
					<Card className="shadow-lg ring-2 ring-primary/25 w-[min(100%,28rem)] cursor-grabbing">
						<CardContent className="p-3">
							<p className="text-sm font-medium leading-snug">{overlayPage.label}</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								{WORKSPACE_PAGE_TEMPLATES.find((t) => t.templateKey === overlayPage.templateKey)
									?.defaultLabel ?? overlayPage.templateKey}
							</p>
						</CardContent>
					</Card>
				</DragOverlay>
			) : null}
		</DndContext>
	);
}
