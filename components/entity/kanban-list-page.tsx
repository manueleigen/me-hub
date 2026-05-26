"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard, type KanbanColumn } from "@/components/kanban-board";
import { SortableTable, type ColumnConfig } from "@/components/sortable-table";
import { StatsGrid } from "@/components/stats-grid";
import { GroupedEntityTab } from "@/components/entity/grouped-entity-tab";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import {
	defaultKanbanStatsCards,
	type KanbanListLabels,
	type KanbanListStats,
	type PriorityConfigMap,
	type StatusConfigMap,
} from "@/lib/entity/types";

type ViewMode = "kanban" | "list" | "grouped";

export type KanbanListPageProps<T> = {
	labels: KanbanListLabels;
	items: T[];
	isRefreshing: boolean;
	stats: KanbanListStats;
	kanbanColumns: KanbanColumn[];
	statusConfig: StatusConfigMap;
	priorityConfig: PriorityConfigMap;
	tableColumns: ColumnConfig<T>[];
	groups: Record<string, T[]>;
	emptyGroupLabel: string;
	groupIcon: ReactNode;
	getItemKey: (item: T) => string;
	getItemStatus: (item: T) => string;
	getTitle: (item: T) => string;
	getPriority: (item: T) => string;
	onCreate: () => void;
	onOpenDetail: (item: T) => void;
	onDelete: (item: T) => void;
	onStatusChange: (item: T, status: string) => Promise<void>;
	renderKanbanCard: (
		item: T,
		actions: { onOpen: () => void; onDelete: () => void },
		onMoveToColumn: (columnKey: string) => Promise<void>,
	) => ReactNode;
	renderGroupedTrailing?: (item: T) => ReactNode;
	detailOpen: boolean;
	onDetailOpenChange: (open: boolean) => void;
	detailItem: T | undefined;
	renderEditDrawer: (props: {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		item: T | undefined;
	}) => ReactNode;
};

export function KanbanListPage<T>({
	labels,
	items,
	isRefreshing,
	stats,
	kanbanColumns,
	statusConfig,
	priorityConfig,
	tableColumns,
	groups,
	emptyGroupLabel,
	groupIcon,
	getItemKey,
	getItemStatus,
	getTitle,
	getPriority,
	onCreate,
	onOpenDetail,
	onDelete,
	onStatusChange,
	renderKanbanCard,
	renderGroupedTrailing,
	detailOpen,
	onDetailOpenChange,
	detailItem,
	renderEditDrawer,
}: KanbanListPageProps<T>) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const [view, setView] = useState<ViewMode>("kanban");
	const EmptyIcon = labels.emptyIcon;

	return (
		<>
			<AppHeader breadcrumbs={[{ label: labels.breadcrumb }]} />
			<div className="flex-1 overflow-auto p-6">
				<div className="flex items-start justify-between gap-4 mb-6">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">{labels.title}</h1>
						<p className="text-muted-foreground">
							{labels.subtitle}
							{isRefreshing && (
								<span className="ml-2 text-xs opacity-70">Aktualisiere…</span>
							)}
						</p>
					</div>
					<Button onClick={onCreate} disabled={!vaultWriteEnabled}>
						<Plus className="mr-2 size-4" />
						{labels.createButton}
					</Button>
				</div>

				<StatsGrid cards={defaultKanbanStatsCards(stats, labels)} />

				{items.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<EmptyIcon className="size-12 text-muted-foreground mb-4" />
						<h3 className="font-semibold text-lg">{labels.emptyTitle}</h3>
						<p className="text-muted-foreground text-sm mt-1">
							{labels.emptyDescription}
						</p>
						<Button
							className="mt-4"
							onClick={onCreate}
							disabled={!vaultWriteEnabled}
						>
							<Plus className="size-4 mr-2" />
							{labels.emptyCreateButton}
						</Button>
					</div>
				) : (
					<Tabs
						value={view}
						onValueChange={(v) => setView(v as ViewMode)}
						className="space-y-4"
					>
						<TabsList>
							<TabsTrigger value="kanban">Kanban</TabsTrigger>
							<TabsTrigger value="list">Liste</TabsTrigger>
							<TabsTrigger value="grouped">{labels.groupTabLabel}</TabsTrigger>
						</TabsList>

						<TabsContent value="kanban">
							<KanbanBoard
								columns={kanbanColumns}
								items={items}
								getItemKey={getItemKey}
								getItemStatus={getItemStatus}
								onStatusChange={onStatusChange}
								renderCard={(item, onMoveToColumn) =>
									renderKanbanCard(
										item,
										{
											onOpen: () => onOpenDetail(item),
											onDelete: () => onDelete(item),
										},
										onMoveToColumn,
									)
								}
							/>
						</TabsContent>

						<TabsContent value="list">
							<SortableTable
								columns={tableColumns}
								data={items}
								getRowKey={getItemKey}
								onRowClick={onOpenDetail}
								emptyMessage={labels.listEmptyMessage}
							/>
						</TabsContent>

						<TabsContent value="grouped">
							<GroupedEntityTab
								groups={groups}
								emptyGroupLabel={emptyGroupLabel}
								groupIcon={groupIcon}
								statusConfig={statusConfig}
								priorityConfig={priorityConfig}
								getItemKey={getItemKey}
								getTitle={getTitle}
								getStatus={getItemStatus}
								getPriority={getPriority}
								renderTrailing={renderGroupedTrailing}
								onOpen={onOpenDetail}
							/>
						</TabsContent>
					</Tabs>
				)}
			</div>

			{renderEditDrawer({
				open: detailOpen,
				onOpenChange: onDetailOpenChange,
				item: detailItem,
			})}
		</>
	);
}
