"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/app-select";
import { optionsFromConfig, optionsFromLabels } from "@/lib/app-select-options";
import { TagInput } from "@/components/tag-input";
import { DetailDrawer } from "@/components/detail-drawer/detail-drawer";
import { DetailDrawerTitle } from "@/components/detail-drawer/detail-drawer-title";
import { DetailDrawerFooter } from "@/components/detail-drawer/detail-drawer-footer";
import { useDetailDrawer } from "@/hooks/use-detail-drawer";
import { DRAFT_RECORD_SLUG, isDraftSlug } from "@/lib/detail-drawer/constants";
import { slugify } from "@/lib/frontmatter";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import {
	IDEA_CATEGORIES,
	STATUS_CONFIG,
	PRIORITY_CONFIG,
} from "@/types/produkt-ideen";
import type {
	ProductIdea,
	ProductIdeaFrontmatter,
	IdeaStatus,
	IdeaPriority,
} from "@/types/produkt-ideen";

const ideaStatusOptions = optionsFromConfig(STATUS_CONFIG);
const ideaPriorityOptions = optionsFromConfig(PRIORITY_CONFIG);
const ideaCategoryOptions = optionsFromLabels(IDEA_CATEGORIES);

export type IdeaFormSnapshot = {
	title: string;
	description: string;
	category: string;
	status: IdeaStatus;
	priority: IdeaPriority;
	targetAudience: string;
	potentialRevenue: string;
	effortEstimate: string;
	tags: string[];
	notes: string;
};

function snapshotFromIdea(idea: ProductIdea): IdeaFormSnapshot {
	return {
		title: idea.title,
		description: idea.description ?? "",
		category: idea.category,
		status: idea.status,
		priority: idea.priority,
		targetAudience: idea.targetAudience ?? "",
		potentialRevenue: idea.potentialRevenue ?? "",
		effortEstimate: idea.effortEstimate ?? "",
		tags: Array.isArray(idea.tags) ? idea.tags : [],
		notes: idea.notes ?? "",
	};
}

function snapshotsEqual(a: IdeaFormSnapshot, b: IdeaFormSnapshot): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function createDraftIdea(): ProductIdea {
	return {
		slug: DRAFT_RECORD_SLUG,
		categorySlug: slugify("Digital-Produkt"),
		title: "",
		description: "",
		category: "Digital-Produkt",
		status: "idea",
		priority: "medium",
		tags: [],
		body: "",
		comments: [],
	};
}

type IdeaDetailViewProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	idea?: ProductIdea;
	onSave: (
		categorySlug: string,
		slug: string,
		data: ProductIdeaFrontmatter,
		body: string,
		sha?: string,
		oldCategorySlug?: string,
	) => Promise<void>;
};

export function IdeaDetailView({
	open,
	onOpenChange,
	idea,
	onSave,
}: IdeaDetailViewProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const ideaRef = useRef(idea);
	const isCreate = idea ? isDraftSlug(idea.slug) : false;

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("Digital-Produkt");
	const [status, setStatus] = useState<IdeaStatus>("idea");
	const [priority, setPriority] = useState<IdeaPriority>("medium");
	const [targetAudience, setTargetAudience] = useState("");
	const [potentialRevenue, setPotentialRevenue] = useState("");
	const [effortEstimate, setEffortEstimate] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [notes, setNotes] = useState("");

	useEffect(() => {
		ideaRef.current = idea;
	}, [idea]);

	const resetForm = useCallback(() => {
		if (!idea) return;
		const snap = snapshotFromIdea(idea);
		setTitle(snap.title);
		setDescription(snap.description);
		setCategory(snap.category);
		setStatus(snap.status);
		setPriority(snap.priority);
		setTargetAudience(snap.targetAudience);
		setPotentialRevenue(snap.potentialRevenue);
		setEffortEstimate(snap.effortEstimate);
		setTags(snap.tags);
		setNotes(snap.notes);
	}, [idea]);

	useEffect(() => {
		if (!open || !idea) return;
		resetForm();
	}, [open, idea?.slug, idea?.categorySlug, resetForm]);

	const getSnapshot = useCallback(
		(): IdeaFormSnapshot => ({
			title: title.trim(),
			description: description.trim(),
			category,
			status,
			priority,
			targetAudience: targetAudience.trim(),
			potentialRevenue: potentialRevenue.trim(),
			effortEstimate: effortEstimate.trim(),
			tags,
			notes: notes.trim(),
		}),
		[
			title,
			description,
			category,
			status,
			priority,
			targetAudience,
			potentialRevenue,
			effortEstimate,
			tags,
			notes,
		],
	);

	const buildInitialSnapshot = useCallback(
		(): IdeaFormSnapshot => (idea ? snapshotFromIdea(idea) : getSnapshot()),
		[idea, getSnapshot],
	);

	const persistSnapshot = useCallback(
		async (snapshot: IdeaFormSnapshot) => {
			const active = ideaRef.current;
			if (!active) return;

			const categorySlug = slugify(snapshot.category);
			const slug = isDraftSlug(active.slug) ? slugify(snapshot.title) : active.slug;
			const data: ProductIdeaFrontmatter = {
				title: snapshot.title,
				description: snapshot.description,
				category: snapshot.category,
				status: snapshot.status,
				priority: snapshot.priority,
				targetAudience: snapshot.targetAudience || undefined,
				potentialRevenue: snapshot.potentialRevenue || undefined,
				effortEstimate: snapshot.effortEstimate || undefined,
				tags: snapshot.tags,
				notes: snapshot.notes || undefined,
			};

			await onSave(
				categorySlug,
				slug,
				data,
				`# ${snapshot.title}`,
				isDraftSlug(active.slug) ? undefined : active.sha,
				isDraftSlug(active.slug) ? undefined : active.categorySlug,
			);
		},
		[onSave],
	);

	const drawer = useDetailDrawer({
		open,
		onOpenChange,
		resetDep: idea ? `${idea.categorySlug}/${idea.slug}` : null,
		getSnapshot,
		buildInitialSnapshot,
		isDirtyCompare: (a, b) => !snapshotsEqual(a, b),
		validate: () => (!title.trim() ? "Titel darf nicht leer sein" : null),
		onSave: persistSnapshot,
		saveEnabled: vaultWriteEnabled,
	});

	if (!idea) return null;

	return (
		<DetailDrawer
			open={open}
			onOpenChange={drawer.handleOpenChange}
			srTitle={isCreate ? "Neue Produktidee" : title.trim() || "Idee bearbeiten"}
			onClose={drawer.closeAndSaveInBackground}
			header={
				<DetailDrawerTitle
					id="idea-detail-title"
					value={title}
					onChange={setTitle}
					disabled={!vaultWriteEnabled}
					placeholder="z.B. Freelancer Dashboard"
				/>
			}
			footer={
				<DetailDrawerFooter
					onClose={drawer.closeAndSaveInBackground}
					onSave={drawer.persistAndStay}
					saving={drawer.saving}
					isDirty={drawer.isDirty()}
					writeEnabled={vaultWriteEnabled}
				/>
			}
		>
			<div className="space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="idea-detail-desc">Beschreibung</Label>
					<Textarea
						id="idea-detail-desc"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						disabled={!vaultWriteEnabled}
						placeholder="Was ist die Idee?"
					/>
				</div>

				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label>Kategorie</Label>
						<AppSelect
							variant="default"
							value={category}
							onValueChange={setCategory}
							options={ideaCategoryOptions}
							disabled={!vaultWriteEnabled}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>Status</Label>
						<AppSelect
							variant="pill"
							value={status}
							onValueChange={(v) => setStatus(v as IdeaStatus)}
							options={ideaStatusOptions}
							disabled={!vaultWriteEnabled}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>Priorität</Label>
						<AppSelect
							variant="colored"
							value={priority}
							onValueChange={(v) => setPriority(v as IdeaPriority)}
							options={ideaPriorityOptions}
							disabled={!vaultWriteEnabled}
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="idea-detail-audience">Zielgruppe</Label>
					<Input
						id="idea-detail-audience"
						value={targetAudience}
						onChange={(e) => setTargetAudience(e.target.value)}
						disabled={!vaultWriteEnabled}
					/>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<Label htmlFor="idea-detail-revenue">Umsatzpotenzial</Label>
						<Input
							id="idea-detail-revenue"
							value={potentialRevenue}
							onChange={(e) => setPotentialRevenue(e.target.value)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="idea-detail-effort">Aufwand</Label>
						<Input
							id="idea-detail-effort"
							value={effortEstimate}
							onChange={(e) => setEffortEstimate(e.target.value)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label>Tags</Label>
					<TagInput values={tags} onChange={setTags} />
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="idea-detail-notes">Notizen</Label>
					<Textarea
						id="idea-detail-notes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={3}
						disabled={!vaultWriteEnabled}
					/>
				</div>
			</div>
		</DetailDrawer>
	);
}
