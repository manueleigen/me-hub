"use client";

import { useState, useRef, KeyboardEvent } from "react";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
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
import { slugify } from "@/lib/frontmatter";

interface IdeaDialogProps {
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
}

function TagInput({
	values,
	onChange,
}: {
	values: string[];
	onChange: (values: string[]) => void;
}) {
	const [inputVal, setInputVal] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const add = () => {
		const trimmed = inputVal.trim();
		if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
		setInputVal("");
	};

	const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			add();
		}
	};

	return (
		<div
			className="flex flex-wrap gap-1.5 min-h-9 rounded-md border bg-background px-3 py-2 cursor-text"
			onClick={() => inputRef.current?.focus()}
		>
			{values?.map((v) => (
				<Badge key={v} variant="secondary" className="gap-1 pr-1">
					{v}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onChange(values.filter((x) => x !== v));
						}}
						className="hover:text-destructive"
					>
						<X className="size-3" />
					</button>
				</Badge>
			))}
			<input
				ref={inputRef}
				value={inputVal}
				onChange={(e) => setInputVal(e.target.value)}
				onKeyDown={handleKey}
				onBlur={add}
				placeholder="Tag + Enter"
				className="flex-1 min-w-20 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>
		</div>
	);
}

export function IdeaDialog({
	open,
	onOpenChange,
	idea,
	onSave,
}: IdeaDialogProps) {
	const isEdit = !!idea;

	const [title, setTitle] = useState(idea?.title ?? "");
	const [description, setDescription] = useState(idea?.description ?? "");
	const [category, setCategory] = useState(idea?.category ?? "Digital-Produkt");
	const [status, setStatus] = useState<IdeaStatus>(idea?.status ?? "idea");
	const [priority, setPriority] = useState<IdeaPriority>(
		idea?.priority ?? "medium",
	);
	const [targetAudience, setTargetAudience] = useState(
		idea?.targetAudience ?? "",
	);
	const [potentialRevenue, setPotentialRevenue] = useState(
		idea?.potentialRevenue ?? "",
	);
	const [effortEstimate, setEffortEstimate] = useState(
		idea?.effortEstimate ?? "",
	);
	const [tags, setTags] = useState<string[]>(
		Array.isArray(idea?.tags) ? idea.tags : [],
	);
	const [notes, setNotes] = useState(idea?.notes ?? "");
	const [saving, setSaving] = useState(false);

	const reset = () => {
		setTitle(idea?.title ?? "");
		setDescription(idea?.description ?? "");
		setCategory(idea?.category ?? "Digital-Produkt");
		setStatus(idea?.status ?? "idea");
		setPriority(idea?.priority ?? "medium");
		setTargetAudience(idea?.targetAudience ?? "");
		setPotentialRevenue(idea?.potentialRevenue ?? "");
		setEffortEstimate(idea?.effortEstimate ?? "");
		setTags(Array.isArray(idea?.tags) ? idea.tags : []);
		setNotes(idea?.notes ?? "");
	};

	const handleOpenChange = (v: boolean) => {
		if (!v) reset();
		onOpenChange(v);
	};

	const handleSave = async () => {
		if (!title.trim()) return;
		setSaving(true);
		try {
			const newCategorySlug = slugify(category);
			const slug = isEdit ? idea.slug : slugify(title);
			const data: ProductIdeaFrontmatter = {
				title: title.trim(),
				description: description.trim(),
				category,
				status,
				priority,
				targetAudience: targetAudience.trim() || undefined,
				potentialRevenue: potentialRevenue.trim() || undefined,
				effortEstimate: effortEstimate.trim() || undefined,
				tags,
				notes: notes.trim() || undefined,
			};
			const body = `# ${title.trim()}`;
			await onSave(
				newCategorySlug,
				slug,
				data,
				body,
				idea?.sha,
				isEdit ? idea.categorySlug : undefined,
			);
			onOpenChange(false);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Idee bearbeiten" : "Neue Produktidee"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label htmlFor="idea-title">Titel</Label>
						<Input
							id="idea-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="z.B. Freelancer Dashboard"
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="idea-desc">Beschreibung</Label>
						<Textarea
							id="idea-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder="Was ist die Idee? Was macht sie besonders?"
						/>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-1.5">
							<Label>Kategorie</Label>
							<Select value={category} onValueChange={setCategory}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{IDEA_CATEGORIES.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label>Status</Label>
							<Select
								value={status}
								onValueChange={(v) => setStatus(v as IdeaStatus)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(Object.keys(STATUS_CONFIG) as IdeaStatus[]).map((s) => (
										<SelectItem key={s} value={s}>
											{STATUS_CONFIG[s].label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label>Priorität</Label>
							<Select
								value={priority}
								onValueChange={(v) => setPriority(v as IdeaPriority)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(Object.keys(PRIORITY_CONFIG) as IdeaPriority[]).map((p) => (
										<SelectItem key={p} value={p}>
											{PRIORITY_CONFIG[p].label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="idea-audience">Zielgruppe</Label>
						<Input
							id="idea-audience"
							value={targetAudience}
							onChange={(e) => setTargetAudience(e.target.value)}
							placeholder="z.B. Freelance Designer"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="idea-revenue">Umsatzpotenzial</Label>
							<Input
								id="idea-revenue"
								value={potentialRevenue}
								onChange={(e) => setPotentialRevenue(e.target.value)}
								placeholder="z.B. 29–49 EUR"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="idea-effort">Aufwand</Label>
							<Input
								id="idea-effort"
								value={effortEstimate}
								onChange={(e) => setEffortEstimate(e.target.value)}
								placeholder="z.B. 2 Wochen"
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label>Tags</Label>
						<TagInput values={tags} onChange={setTags} />
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="idea-notes">Notizen</Label>
						<Textarea
							id="idea-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							placeholder="Weitere Gedanken, Links, Konkurrenzanalyse…"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => handleOpenChange(false)}>
						Abbrechen
					</Button>
					<Button onClick={handleSave} disabled={saving || !title.trim()}>
						{saving ? "Speichern…" : "Speichern"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
