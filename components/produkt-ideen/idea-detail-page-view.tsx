"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DetailField } from "@/components/entity-detail/detail-field";
import { EntityDetailPageLayout } from "@/components/entity/entity-detail-page-layout";
import {
	DetailFieldsGrid,
	StatusPriorityBadges,
	StatusPriorityDetailFields,
	TagsDetailField,
	TextDetailField,
} from "@/components/entity/detail-fields";
import { RelatedLinksSection } from "@/components/entity/linked-section-card";
import { IdeaDetailView } from "@/components/produkt-ideen/idea-detail-view";
import {
	deleteProductIdea,
	saveProductIdea,
} from "@/app/actions/produkt-ideen";
import { useWorkspace } from "@/lib/workspace-context";
import {
	ideaDetailPath,
	ideasListPath,
} from "@/lib/workspace-paths";
import { ideaKey } from "@/lib/entity/modules/product-ideas";
import {
	STATUS_CONFIG,
	PRIORITY_CONFIG,
} from "@/types/produkt-ideen";
import type {
	ProductIdea,
	ProductIdeaFrontmatter,
} from "@/types/produkt-ideen";
import type { TaskComment } from "@/types/aufgaben";

type IdeaDetailPageViewProps = {
	idea: ProductIdea;
	relatedIdeas: ProductIdea[];
};

export function IdeaDetailPageView({
	idea: initialIdea,
	relatedIdeas,
}: IdeaDetailPageViewProps) {
	const workspaceSlug = useWorkspace()?.workspace.slug;
	const router = useRouter();

	const [idea, setIdea] = useState(initialIdea);
	const [comments, setComments] = useState(initialIdea.comments ?? []);

	useEffect(() => {
		setIdea(initialIdea);
		setComments(initialIdea.comments ?? []);
	}, [initialIdea]);

	const handleSave = async (
		categorySlug: string,
		slug: string,
		data: ProductIdeaFrontmatter,
		body: string,
		sha?: string,
		oldCategorySlug?: string,
		nextComments: TaskComment[] = comments,
	) => {
		await saveProductIdea(
			categorySlug,
			slug,
			data,
			body,
			sha ?? idea.sha,
			oldCategorySlug,
			nextComments,
		);
		const saved: ProductIdea = {
			...data,
			slug,
			categorySlug,
			sha: idea.sha,
			body,
			tags: data.tags ?? [],
			comments: nextComments,
		};
		setIdea(saved);
		setComments(nextComments);
		const pathChanged =
			slug !== idea.slug || categorySlug !== idea.categorySlug;
		if (pathChanged) {
			router.replace(ideaDetailPath(workspaceSlug, categorySlug, slug));
		}
	};

	const handleAddComment = async (comment: TaskComment) => {
		await handleSave(
			idea.categorySlug,
			idea.slug,
			{
				title: idea.title,
				description: idea.description,
				category: idea.category,
				status: idea.status,
				priority: idea.priority,
				targetAudience: idea.targetAudience,
				potentialRevenue: idea.potentialRevenue,
				effortEstimate: idea.effortEstimate,
				tags: idea.tags,
				notes: idea.notes,
			},
			idea.body,
			idea.sha,
			undefined,
			[...comments, comment],
		);
	};

	const handleDelete = async () => {
		if (!idea.sha) return;
		await deleteProductIdea(idea.categorySlug, idea.slug, idea.sha);
		toast.success("Idee gelöscht");
		router.push(ideasListPath(workspaceSlug));
	};

	return (
		<EntityDetailPageLayout
			listLabel="Produkt-Ideen"
			listHref={ideasListPath(workspaceSlug)}
			title={idea.title}
			badges={
				<StatusPriorityBadges
					status={idea.status}
					priority={idea.priority}
					statusConfig={STATUS_CONFIG}
					priorityConfig={PRIORITY_CONFIG}
				/>
			}
			sha={idea.sha}
			comments={comments}
			onCommentsChange={setComments}
			onAddComment={handleAddComment}
			deleteDialogTitle="Idee löschen?"
			editAriaLabel="Idee bearbeiten"
			deleteAriaLabel="Idee löschen"
			onDelete={handleDelete}
			details={
				<DetailFieldsGrid>
					<StatusPriorityDetailFields
						status={idea.status}
						priority={idea.priority}
						statusConfig={STATUS_CONFIG}
						priorityConfig={PRIORITY_CONFIG}
					/>
					<DetailField label="Kategorie">
						<Badge variant="outline">{idea.category}</Badge>
					</DetailField>
					<TextDetailField label="Zielgruppe" value={idea.targetAudience} />
					<TextDetailField
						label="Umsatzpotenzial"
						value={idea.potentialRevenue}
					/>
					<TextDetailField label="Aufwand" value={idea.effortEstimate} />
					<TagsDetailField tags={idea.tags} />
					<TextDetailField
						label="Beschreibung"
						value={idea.description}
						className="sm:col-span-2"
						prose
					/>
					<TextDetailField
						label="Notizen"
						value={idea.notes}
						className="sm:col-span-2"
					/>
				</DetailFieldsGrid>
			}
			narrowContent={
				idea.category ? (
					<RelatedLinksSection
						title="Weitere Ideen in dieser Kategorie"
						linkHref={ideasListPath(workspaceSlug)}
						linkLabel="Alle Ideen"
						emptyMessage="Keine weiteren Ideen in dieser Kategorie."
						icon={<Lightbulb className="size-4" />}
						items={relatedIdeas}
						getItemKey={ideaKey}
						getHref={(i) =>
							ideaDetailPath(workspaceSlug, i.categorySlug, i.slug)
						}
						getTitle={(i) => i.title}
						getStatus={(i) => i.status}
						statusConfig={STATUS_CONFIG}
					/>
				) : null
			}
			renderEditDrawer={({ open, onOpenChange }) => (
				<IdeaDetailView
					open={open}
					onOpenChange={onOpenChange}
					idea={idea}
					onSave={handleSave}
				/>
			)}
		/>
	);
}
