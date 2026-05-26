"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
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
import { TagInput } from "@/components/tag-input";
import { DetailDrawer } from "@/components/detail-drawer/detail-drawer";
import { DetailDrawerTitle } from "@/components/detail-drawer/detail-drawer-title";
import { DetailDrawerFooter } from "@/components/detail-drawer/detail-drawer-footer";
import { useDetailDrawer } from "@/hooks/use-detail-drawer";
import { isDraftSlug, DRAFT_RECORD_SLUG } from "@/lib/detail-drawer/constants";
import { slugify, coerceStringArray } from "@/lib/frontmatter";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import { useWorkspace } from "@/lib/workspace-context";
import { clientsListPath } from "@/lib/workspace-paths";
import type { Project, ProjectFrontmatter, ProjectType } from "@/types/projects";
import type { Client } from "@/types/clients";

export const PROJECT_STATUS_OPTIONS = [
	{ value: "active", label: "Aktiv" },
	{ value: "planning", label: "Planung" },
	{ value: "in-progress", label: "In Arbeit" },
	{ value: "review", label: "Review" },
	{ value: "completed", label: "Abgeschlossen" },
	{ value: "on-hold", label: "Pausiert" },
	{ value: "draft", label: "Entwurf" },
] as const;

export type ProjectFormSnapshot = {
	title: string;
	type: ProjectType;
	clientSlug: string;
	clientName: string;
	category: string[];
	skills: string[];
	tools: string[];
	area: string[];
	status: string;
	date: string;
	description: string;
};

export function snapshotFromProject(project: Project): ProjectFormSnapshot {
	return {
		title: project.title,
		type: project.type,
		clientSlug: project.client ?? "",
		clientName: project.clientName ?? "",
		category: coerceStringArray(project.category),
		skills: coerceStringArray(project.skills),
		tools: coerceStringArray(project.tools),
		area: coerceStringArray(project.area),
		status: project.status ?? "active",
		date: project.date ?? "",
		description: project.body ?? "## Details\n\n## Beschreibung\n",
	};
}

function snapshotsEqual(a: ProjectFormSnapshot, b: ProjectFormSnapshot): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function createDraftProject(): Project {
	return {
		slug: DRAFT_RECORD_SLUG,
		title: "",
		type: "freelance",
		category: [],
		skills: [],
		tools: [],
		area: [],
		body: "## Details\n\n## Beschreibung\n",
	};
}

type ProjectDetailViewProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	project?: Project;
	clients: Client[];
	onSave: (
		slug: string,
		data: ProjectFrontmatter,
		body: string,
		sha?: string,
	) => Promise<void>;
};

export function ProjectDetailView({
	open,
	onOpenChange,
	project,
	clients,
	onSave,
}: ProjectDetailViewProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const workspaceSlug = useWorkspace()?.workspace.slug;
	const projectRef = useRef(project);
	const isCreate = project ? isDraftSlug(project.slug) : false;

	const [title, setTitle] = useState("");
	const [type, setType] = useState<ProjectType>("freelance");
	const [clientSlug, setClientSlug] = useState("");
	const [clientName, setClientName] = useState("");
	const [category, setCategory] = useState<string[]>([]);
	const [skills, setSkills] = useState<string[]>([]);
	const [tools, setTools] = useState<string[]>([]);
	const [area, setArea] = useState<string[]>([]);
	const [status, setStatus] = useState("active");
	const [date, setDate] = useState("");
	const [description, setDescription] = useState("## Details\n\n## Beschreibung\n");

	useEffect(() => {
		projectRef.current = project;
	}, [project]);

	const resetForm = useCallback(() => {
		if (!project) return;
		const snap = snapshotFromProject(project);
		setTitle(snap.title);
		setType(snap.type);
		setClientSlug(snap.clientSlug);
		setClientName(snap.clientName);
		setCategory(snap.category);
		setSkills(snap.skills);
		setTools(snap.tools);
		setArea(snap.area);
		setStatus(snap.status);
		setDate(snap.date);
		setDescription(snap.description);
	}, [project]);

	useEffect(() => {
		if (!open || !project) return;
		resetForm();
	}, [open, project?.slug, resetForm]);

	const getSnapshot = useCallback(
		(): ProjectFormSnapshot => ({
			title: title.trim(),
			type,
			clientSlug,
			clientName,
			category,
			skills,
			tools,
			area,
			status,
			date,
			description,
		}),
		[
			title,
			type,
			clientSlug,
			clientName,
			category,
			skills,
			tools,
			area,
			status,
			date,
			description,
		],
	);

	const buildInitialSnapshot = useCallback(
		(): ProjectFormSnapshot => (project ? snapshotFromProject(project) : getSnapshot()),
		[project, getSnapshot],
	);

	const persistSnapshot = useCallback(
		async (snapshot: ProjectFormSnapshot) => {
			const active = projectRef.current;
			if (!active) return;

			const slug = isDraftSlug(active.slug) ? slugify(snapshot.title) : active.slug;
			const data: ProjectFrontmatter = {
				type: snapshot.type,
				title: snapshot.title,
				clientName: snapshot.clientName.trim() || undefined,
				client: snapshot.clientSlug.trim() || undefined,
				category: snapshot.category,
				skills: snapshot.skills,
				tools: snapshot.tools,
				area: snapshot.area,
				status: snapshot.status || undefined,
				date:
					snapshot.date ||
					active.date ||
					new Date().toISOString().split("T")[0],
			};

			await onSave(
				slug,
				data,
				snapshot.description,
				isDraftSlug(active.slug) ? undefined : active.sha,
			);
		},
		[onSave],
	);

	const drawer = useDetailDrawer({
		open,
		onOpenChange,
		resetDep: project?.slug,
		getSnapshot,
		buildInitialSnapshot,
		isDirtyCompare: (a, b) => !snapshotsEqual(a, b),
		validate: () => (!title.trim() ? "Titel darf nicht leer sein" : null),
		onSave: persistSnapshot,
		saveEnabled: vaultWriteEnabled,
	});

	const handleClientSelect = (value: string) => {
		if (value === "__new__") {
			window.open(clientsListPath(workspaceSlug), "_blank");
			return;
		}
		const client = clients.find((c) => c.slug === value);
		if (client) {
			setClientSlug(client.slug);
			setClientName(client.name);
		}
	};

	if (!project) return null;

	return (
		<DetailDrawer
			open={open}
			onOpenChange={drawer.handleOpenChange}
			srTitle={isCreate ? "Neues Projekt" : title.trim() || "Projekt bearbeiten"}
			onClose={drawer.closeAndSaveInBackground}
			header={
				<DetailDrawerTitle
					id="proj-detail-title"
					value={title}
					onChange={setTitle}
					disabled={!vaultWriteEnabled}
					placeholder="Projekttitel"
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
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label>Typ</Label>
						<Select
							value={type}
							onValueChange={(v) => setType(v as ProjectType)}
							disabled={!vaultWriteEnabled}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="freelance">Freelance</SelectItem>
								<SelectItem value="job">Job</SelectItem>
								<SelectItem value="personal">Persönlich</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label>Status</Label>
						<Select
							value={status}
							onValueChange={setStatus}
							disabled={!vaultWriteEnabled}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PROJECT_STATUS_OPTIONS.map((o) => (
									<SelectItem key={o.value} value={o.value}>
										{o.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="proj-detail-date">Datum</Label>
						<Input
							id="proj-detail-date"
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							disabled={!vaultWriteEnabled}
						/>
					</div>

					<div className="space-y-1.5 sm:col-span-2">
						<Label>Klient</Label>
						<Select
							value={clientSlug || ""}
							onValueChange={handleClientSelect}
							disabled={!vaultWriteEnabled}
						>
							<SelectTrigger>
								<SelectValue placeholder="Klient wählen…" />
							</SelectTrigger>
							<SelectContent>
								{clients.map((c) => (
									<SelectItem key={c.slug} value={c.slug}>
										{c.name}
									</SelectItem>
								))}
								<SelectItem value="__new__">
									<span className="flex items-center gap-1.5 text-primary">
										<ExternalLink className="size-3" />
										Neuen Klienten anlegen
									</span>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label>Kategorien</Label>
					<TagInput values={category} onChange={setCategory} />
				</div>
				<div className="space-y-1.5">
					<Label>Skills</Label>
					<TagInput values={skills} onChange={setSkills} />
				</div>
				<div className="space-y-1.5">
					<Label>Tools & Software</Label>
					<TagInput values={tools} onChange={setTools} />
				</div>
				<div className="space-y-1.5">
					<Label>Bereiche</Label>
					<TagInput values={area} onChange={setArea} />
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="proj-detail-desc">Beschreibung</Label>
					<Textarea
						id="proj-detail-desc"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={8}
						disabled={!vaultWriteEnabled}
						placeholder="Projektbeschreibung…"
						className="font-mono text-sm"
					/>
				</div>
			</div>
		</DetailDrawer>
	);
}
