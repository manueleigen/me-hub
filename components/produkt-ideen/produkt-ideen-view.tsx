"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { KanbanEntityCard } from "@/components/entity/kanban-entity-card";
import { KanbanListPage } from "@/components/entity/kanban-list-page";
import { useKanbanListState } from "@/components/entity/use-kanban-list-state";
import {
	IdeaDetailView,
	createDraftIdea,
} from "@/components/produkt-ideen/idea-detail-view";
import { isDraftSlug } from "@/lib/detail-drawer/constants";
import {
	saveProductIdea,
	deleteProductIdea,
	updateIdeaStatus,
} from "@/app/actions/produkt-ideen";
import {
	ideaGroupIcon,
	ideaKanbanColumns,
	ideaKey,
	ideaListLabels,
	ideaListStats,
	ideaTableColumns,
	ideasByCategory,
} from "@/lib/entity/modules/product-ideas";
import {
	STATUS_CONFIG,
	PRIORITY_CONFIG,
} from "@/types/produkt-ideen";
import type {
	ProductIdea,
	ProductIdeaFrontmatter,
	IdeaStatus,
} from "@/types/produkt-ideen";
import type { TaskComment } from "@/types/aufgaben";
import { useWorkspace } from "@/lib/workspace-context";
import { ideaDetailPath } from "@/lib/workspace-paths";

export function ProduktIdeenView({ ideas: initialIdeas }: { ideas: ProductIdea[] }) {
	const workspaceSlug = useWorkspace()?.workspace.slug;
	const router = useRouter();

	const listState = useKanbanListState<ProductIdea>({
		initialItems: initialIdeas,
		getItemKey: ideaKey,
		getItemSha: (i) => i.sha,
		isDraftItem: (i) => isDraftSlug(i.slug),
		shouldSyncDetailTarget: (current, next) =>
			!current ||
			ideaKey(current) === ideaKey(next) ||
			isDraftSlug(current.slug),
		upsertItems: (items, optimistic, { oldKey }) => {
			const key = ideaKey(optimistic);
			const withoutOld =
				oldKey && oldKey !== key
					? items.filter((i) => ideaKey(i) !== oldKey)
					: items.filter((i) => ideaKey(i) !== key);
			const exists = withoutOld.some((i) => ideaKey(i) === key);
			return exists
				? withoutOld.map((i) => (ideaKey(i) === key ? optimistic : i))
				: [...withoutOld, optimistic];
		},
		findPreviousItem: (items, optimistic, { oldKey }) => {
			const key = ideaKey(optimistic);
			return items.find(
				(i) => ideaKey(i) === key || (oldKey != null && ideaKey(i) === oldKey),
			);
		},
		persistItem: async (optimistic, { previous }) => {
			const data: ProductIdeaFrontmatter = {
				title: optimistic.title,
				description: optimistic.description,
				category: optimistic.category,
				status: optimistic.status,
				priority: optimistic.priority,
				targetAudience: optimistic.targetAudience,
				potentialRevenue: optimistic.potentialRevenue,
				effortEstimate: optimistic.effortEstimate,
				tags: optimistic.tags,
				notes: optimistic.notes,
			};
			const oldCategorySlug =
				previous && previous.categorySlug !== optimistic.categorySlug
					? previous.categorySlug
					: undefined;
			await saveProductIdea(
				optimistic.categorySlug,
				optimistic.slug,
				data,
				optimistic.body,
				previous?.sha ?? optimistic.sha,
				oldCategorySlug,
				optimistic.comments ?? [],
			);
			return optimistic;
		},
		deleteItem: (idea) =>
			deleteProductIdea(idea.categorySlug, idea.slug, idea.sha!),
		updateItemStatus: (idea, status) =>
			updateIdeaStatus(
				idea.categorySlug,
				idea.slug,
				idea.sha!,
				status as IdeaStatus,
			),
		applyStatus: (idea, status) => ({
			...idea,
			status: status as IdeaStatus,
			comments: idea.comments ?? [],
		}),
		deleteConfirmMessage: ideaListLabels.deleteConfirm,
	});

	const handleSave = async (
		categorySlug: string,
		slug: string,
		data: ProductIdeaFrontmatter,
		body: string,
		sha?: string,
		oldCategorySlug?: string,
		comments?: TaskComment[],
	) => {
		const keyForLookup = `${categorySlug}/${slug}`;
		const oldKey =
			sha && oldCategorySlug
				? `${oldCategorySlug}/${slug}`
				: sha
					? keyForLookup
					: null;
		const previous = listState.items.find(
			(i) => ideaKey(i) === keyForLookup || (oldKey && ideaKey(i) === oldKey),
		);
		const resolvedComments = comments ?? previous?.comments ?? [];

		const optimistic: ProductIdea = {
			...data,
			slug,
			categorySlug,
			sha,
			body,
			tags: data.tags ?? [],
			comments: resolvedComments,
		};

		await listState.persistWithOptimistic(optimistic, {
			previous,
			oldKey,
		});
	};

	return (
		<KanbanListPage
			labels={ideaListLabels}
			items={listState.items}
			isRefreshing={listState.isRefreshing}
			stats={ideaListStats(listState.items)}
			kanbanColumns={ideaKanbanColumns}
			statusConfig={STATUS_CONFIG}
			priorityConfig={PRIORITY_CONFIG}
			tableColumns={ideaTableColumns}
			groups={ideasByCategory(listState.items)}
			emptyGroupLabel="Ohne Kategorie"
			groupIcon={ideaGroupIcon}
			getItemKey={ideaKey}
			getItemStatus={(i) => i.status}
			getTitle={(i) => i.title}
			getPriority={(i) => i.priority}
			onCreate={() => {
				listState.setDetailTarget(createDraftIdea());
				listState.setDetailOpen(true);
			}}
			onOpenDetail={(idea) =>
				router.push(ideaDetailPath(workspaceSlug, idea.categorySlug, idea.slug))
			}
			onDelete={listState.handleDelete}
			onStatusChange={listState.handleStatusChange}
			detailOpen={listState.detailOpen}
			onDetailOpenChange={listState.setDetailOpen}
			detailItem={listState.resolveDetailItem(listState.detailTarget)}
			renderKanbanCard={(idea, actions, onMoveToColumn) => (
				<KanbanEntityCard
					title={idea.title}
					description={idea.description}
					status={idea.status}
					columns={ideaKanbanColumns}
					priorityLabel={PRIORITY_CONFIG[idea.priority]?.label}
					priorityClassName={PRIORITY_CONFIG[idea.priority]?.color}
					meta={
						idea.category ? (
							<Badge variant="outline" className="text-xs">
								{idea.category}
							</Badge>
						) : undefined
					}
					onOpen={actions.onOpen}
					onDelete={actions.onDelete}
					onMoveToColumn={onMoveToColumn}
				/>
			)}
			renderGroupedTrailing={(idea) =>
				idea.effortEstimate ? (
					<span className="text-xs text-muted-foreground shrink-0">
						{idea.effortEstimate}
					</span>
				) : null
			}
			renderEditDrawer={({ open, onOpenChange, item }) => (
				<IdeaDetailView
					open={open}
					onOpenChange={onOpenChange}
					idea={item}
					onSave={handleSave}
				/>
			)}
		/>
	);
}
