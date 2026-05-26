"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface KanbanColumn {
	key: string;
	label: string;
	color: string;
}

interface KanbanBoardProps<T> {
	columns: KanbanColumn[];
	items: T[];
	getItemKey: (item: T) => string;
	getItemStatus: (item: T) => string;
	onStatusChange: (item: T, newColumnKey: string) => Promise<void>;
	renderCard: (
		item: T,
		onMoveToColumn: (columnKey: string) => Promise<void>,
	) => React.ReactNode;
}

export function KanbanBoard<T>({
	columns,
	items,
	getItemKey,
	getItemStatus,
	onStatusChange,
	renderCard,
}: KanbanBoardProps<T>) {
	const [draggedKey, setDraggedKey] = useState<string | null>(null);
	const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
	const [updatingKey, setUpdatingKey] = useState<string | null>(null);

	const isDragging = draggedKey !== null;
	const draggedItem = isDragging
		? items.find((i) => getItemKey(i) === draggedKey)
		: undefined;
	const sourceColumnKey = draggedItem ? getItemStatus(draggedItem) : null;

	const clearDragState = () => {
		setDraggedKey(null);
		setDragOverColumn(null);
	};

	const handleDragStart = (e: React.DragEvent, key: string) => {
		setDraggedKey(key);
		setDragOverColumn(null);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent, columnKey: string) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		if (isDragging && columnKey !== sourceColumnKey) {
			setDragOverColumn(columnKey);
		}
	};

	const handleDrop = async (e: React.DragEvent, targetColumnKey: string) => {
		e.preventDefault();
		if (!draggedKey) return;
		const item = items.find((i) => getItemKey(i) === draggedKey);
		const key = draggedKey;
		clearDragState();
		if (!item || getItemStatus(item) === targetColumnKey) return;
		setUpdatingKey(key);
		try {
			await onStatusChange(item, targetColumnKey);
		} finally {
			setUpdatingKey(null);
		}
	};

	const getMoveHandler = (item: T) => async (newColumnKey: string) => {
		const key = getItemKey(item);
		setUpdatingKey(key);
		try {
			await onStatusChange(item, newColumnKey);
		} finally {
			setUpdatingKey(null);
		}
	};

	return (
		<div className="flex gap-4 pb-4">
			{columns.map((col) => {
				const columnItems = items.filter(
					(item) => getItemStatus(item) === col.key,
				);
				const isSourceColumn = col.key === sourceColumnKey;
				const isValidDropTarget = isDragging && !isSourceColumn;
				const isHoveredDropTarget =
					dragOverColumn === col.key && isValidDropTarget;

				return (
					<div
						key={col.key}
						className={cn(
							"flex-shrink-0 w-[300px] rounded-lg transition-colors",
							isValidDropTarget &&
								"ring-2 ring-dashed ring-muted-foreground/25",
							isHoveredDropTarget && "ring-primary bg-primary/5",
						)}
						onDragOver={(e) => handleDragOver(e, col.key)}
						onDragLeave={(e) => {
							if (!e.currentTarget.contains(e.relatedTarget as Node)) {
								setDragOverColumn((prev) => (prev === col.key ? null : prev));
							}
						}}
						onDrop={(e) => handleDrop(e, col.key)}
					>
						<div
							className={cn(
								"rounded-lg p-3 h-full",
								isHoveredDropTarget ? "bg-primary/5" : "bg-muted/50",
							)}
						>
							<div className="flex items-center gap-2 mb-3">
								<div className={cn("size-2 rounded-full", col.color)} />
								<h3 className="font-medium text-sm">{col.label}</h3>
								<Badge variant="secondary" className="ml-auto">
									{columnItems.length}
								</Badge>
							</div>
							<div className="space-y-2 min-h-[4rem]">
								{columnItems.map((item) => {
									const key = getItemKey(item);
									return (
										<div
											key={key}
											draggable
											onDragStart={(e) => handleDragStart(e, key)}
											onDragEnd={clearDragState}
											className={cn(
												"cursor-grab active:cursor-grabbing",
												draggedKey === key && "opacity-50",
												updatingKey === key && "opacity-60 pointer-events-none",
											)}
										>
											{renderCard(item, getMoveHandler(item))}
										</div>
									);
								})}
								{isValidDropTarget && (
									<div
										className={cn(
											"rounded-md border-2 border-dashed py-6 px-3 text-center text-sm transition-colors",
											isHoveredDropTarget
												? "border-primary bg-primary/10 text-primary"
												: "border-muted-foreground/30 text-muted-foreground",
										)}
									>
										{isHoveredDropTarget
											? "Loslassen zum Verschieben"
											: "Hier ablegen"}
									</div>
								)}
								{!isDragging && columnItems.length === 0 && (
									<div className="text-center py-8 text-muted-foreground text-sm">
										Keine Einträge
									</div>
								)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
