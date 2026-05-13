"use client";

import { useState, useTransition, useOptimistic, useEffect } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "./project-card";
import { ProjectDialog } from "./project-dialog";
import {
	saveProject,
	deleteProject,
	ensureSkillFiles,
} from "@/app/actions/projects";
import { listClients } from "@/app/actions/clients";
import type { Project, ProjectFrontmatter } from "@/types/projects";
import type { Client } from "@/types/clients";
import { AppHeader } from "../layout/app-header";

type FilterType = "all" | "freelance" | "job" | "personal";

type ProjectAction =
	| { type: "add"; payload: Project }
	| { type: "update"; payload: Project }
	| { type: "delete"; slug: string };

function projectReducer(state: Project[], action: ProjectAction): Project[] {
	switch (action.type) {
		case "add":
			return [...state, action.payload];
		case "update":
			return state.map((p) =>
				p.slug === action.payload.slug ? action.payload : p,
			);
		case "delete":
			return state.filter((p) => p.slug !== action.slug);
	}
}

interface ProjectsViewProps {
	projects: Project[];
	clients: Client[];
}

export function ProjectsView({
	projects: initialProjects,
	clients: initialClients,
}: ProjectsViewProps) {
	const [isPending, startTransition] = useTransition();
	const [realProjects, setRealProjects] = useState(initialProjects);
	const [optimisticProjects, dispatch] = useOptimistic(
		realProjects,
		projectReducer,
	);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<FilterType>("all");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<Project | undefined>();
	const [clients, setClients] = useState<Client[]>(initialClients);

	useEffect(() => {
		startTransition(() => setRealProjects(initialProjects));
	}, [initialProjects]);

	const handleDialogOpen = async (open: boolean) => {
		setDialogOpen(open);
		if (open) {
			try {
				const fresh = await listClients();
				setClients(fresh);
			} catch {
				// keep existing list on error
			}
		}
	};

	const filtered = optimisticProjects.filter((p) => {
		const matchesType = filter === "all" || p.type === filter;
		const q = search.toLowerCase();
		const matchesSearch =
			!q ||
			p.title.toLowerCase().includes(q) ||
			(p.clientName?.toLowerCase().includes(q) ?? false) ||
			p.category.some((c) => c.toLowerCase().includes(q)) ||
			p.tools.some((t) => t.toLowerCase().includes(q));
		return matchesType && matchesSearch;
	});

	const openCreate = () => {
		setEditTarget(undefined);
		handleDialogOpen(true);
	};

	const openEdit = (project: Project) => {
		setEditTarget(project);
		handleDialogOpen(true);
	};

	const handleSave = async (
		slug: string,
		data: ProjectFrontmatter,
		body: string,
		sha?: string,
	) => {
		const optimisticProject: Project = {
			slug,
			sha,
			body,
			type: data.type,
			title: data.title,
			client: data.client,
			clientName: data.clientName,
			category: data.category,
			skills: data.skills,
			tools: data.tools,
			area: data.area,
			status: data.status,
			date: data.date,
		};
		startTransition(async () => {
			dispatch(
				sha
					? { type: "update", payload: optimisticProject }
					: { type: "add", payload: optimisticProject },
			);
			try {
				await saveProject(slug, data, body, sha);
				await ensureSkillFiles(data);
				startTransition(() => {
					setRealProjects((prev) =>
						sha
							? prev.map((p) => (p.slug === slug ? optimisticProject : p))
							: [...prev, optimisticProject],
					);
				});
			} catch {
				toast.error("Fehler beim Speichern");
			}
		});
	};

	const handleDelete = (project: Project) => {
		if (!project.sha) return;
		startTransition(async () => {
			dispatch({ type: "delete", slug: project.slug });
			try {
				await deleteProject(project.slug, project.sha!);
				startTransition(() => {
					setRealProjects((prev) =>
						prev.filter((p) => p.slug !== project.slug),
					);
				});
			} catch {
				toast.error("Fehler beim Löschen");
			}
		});
	};

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Projekte" }]} />
			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Projekte</h1>
						<p className="text-sm text-muted-foreground">
							{optimisticProjects.length}{" "}
							{optimisticProjects.length === 1 ? "Projekt" : "Projekte"}
						</p>
					</div>
					<Button onClick={openCreate} disabled={isPending}>
						<Plus className="size-4 mr-2" />
						Neues Projekt
					</Button>
				</div>

				<div className="flex flex-col sm:flex-row gap-3">
					<Input
						placeholder="Projekte durchsuchen…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="max-w-xs"
					/>
					<Tabs
						value={filter}
						onValueChange={(v) => setFilter(v as FilterType)}
					>
						<TabsList>
							<TabsTrigger value="all">Alle</TabsTrigger>
							<TabsTrigger value="freelance">Freelance</TabsTrigger>
							<TabsTrigger value="job">Job</TabsTrigger>
							<TabsTrigger value="personal">Persönlich</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{filtered.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<FolderOpen className="size-12 text-muted-foreground mb-4" />
						<h3 className="font-semibold text-lg">Keine Projekte</h3>
						<p className="text-muted-foreground text-sm mt-1">
							{search || filter !== "all"
								? "Keine Projekte gefunden. Filter anpassen?"
								: "Erstelle dein erstes Projekt."}
						</p>
						{!search && filter === "all" && (
							<Button className="mt-4" onClick={openCreate}>
								<Plus className="size-4 mr-2" />
								Erstes Projekt anlegen
							</Button>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{filtered.map((project) => (
							<ProjectCard
								key={project.slug}
								project={project}
								onEdit={openEdit}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}

				<ProjectDialog
					open={dialogOpen}
					onOpenChange={handleDialogOpen}
					project={editTarget}
					clients={clients}
					onSave={handleSave}
				/>
			</div>
		</>
	);
}
