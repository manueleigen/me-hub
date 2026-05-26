"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DetailField } from "@/components/entity-detail/detail-field";
import { EntityDetailPageLayout } from "@/components/entity/entity-detail-page-layout";
import { DetailFieldsGrid, TextDetailField } from "@/components/entity/detail-fields";
import { ClientQuickDetailDrawer } from "@/components/clients/client-quick-detail-drawer";
import {
	ProjectDetailView,
	PROJECT_STATUS_OPTIONS,
} from "@/components/projects/project-detail-view";
import { ProjectTasksSection } from "@/components/projects/project-tasks-section";
import {
	saveProject,
	deleteProject,
	ensureSkillFiles,
} from "@/app/actions/projects";
import { saveClient } from "@/app/actions/clients";
import { projectBodyForDisplay } from "@/lib/projects/project-body";
import { taskMatchesProject } from "@/lib/projects/task-match";
import { useWorkspace } from "@/lib/workspace-context";
import {
	clientDetailPath,
	projectDetailPath,
	projectsListPath,
} from "@/lib/workspace-paths";
import type { Project, ProjectFrontmatter } from "@/types/projects";
import type { Client, ClientFrontmatter } from "@/types/clients";
import type { Task } from "@/types/aufgaben";
import type { WorkspaceMemberSummary } from "@/app/actions/workspaces";

const TYPE_COLORS: Record<string, string> = {
	freelance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
	job: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
	personal:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

const TYPE_LABELS: Record<string, string> = {
	freelance: "Freelance",
	job: "Job",
	personal: "Persönlich",
};

function statusLabel(status: string | undefined) {
	if (!status) return null;
	return (
		PROJECT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
	);
}

function mergeProjectFromServer(prev: Project, next: Project): Project {
	const nextBody = projectBodyForDisplay(next.body);
	const prevBody = projectBodyForDisplay(prev.body);
	if (!nextBody && prevBody) {
		return { ...next, body: prev.body };
	}
	return next;
}

type ProjectDetailPageViewProps = {
	project: Project;
	client: Client | null;
	clients: Client[];
	tasks: Task[];
	members?: WorkspaceMemberSummary[];
};

export function ProjectDetailPageView({
	project: initialProject,
	client: initialClient,
	clients: initialClients,
	tasks: initialTasks,
	members = [],
}: ProjectDetailPageViewProps) {
	const workspaceSlug = useWorkspace()?.workspace.slug;
	const router = useRouter();

	const [project, setProject] = useState(initialProject);
	const [linkedClient, setLinkedClient] = useState(initialClient);
	const [clients, setClients] = useState(initialClients);
	const [tasks, setTasks] = useState(initialTasks);
	const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
	const [clientEditTarget, setClientEditTarget] = useState<
		Client | undefined
	>();

	useEffect(() => {
		setProject((prev) => mergeProjectFromServer(prev, initialProject));
		setLinkedClient(initialClient);
		setClients(initialClients);
		setTasks(initialTasks);
	}, [initialProject, initialClient, initialClients, initialTasks]);

	const openClientDrawer = () => {
		const c =
			linkedClient ??
			(project.client
				? clients.find((cl) => cl.slug === project.client)
				: undefined);
		if (!c) return;
		setClientEditTarget(c);
		setClientDrawerOpen(true);
	};

	const handleProjectSave = async (
		slug: string,
		data: ProjectFrontmatter,
		body: string,
		sha?: string,
	) => {
		await saveProject(slug, data, body, sha ?? project.sha);
		await ensureSkillFiles(data);

		const saved: Project = { ...data, slug, sha: project.sha, body };
		setProject(saved);
		setLinkedClient(
			data.client ? (clients.find((c) => c.slug === data.client) ?? null) : null,
		);

		if (slug !== project.slug) {
			router.replace(projectDetailPath(workspaceSlug, slug));
		}
	};

	const handleDelete = async () => {
		if (!project.sha) return;
		await deleteProject(project.slug, project.sha);
		toast.success("Projekt gelöscht");
		router.push(projectsListPath(workspaceSlug));
	};

	const handleClientSave = async (
		slug: string,
		data: ClientFrontmatter,
		sha?: string,
	) => {
		await saveClient(slug, data, sha);
		const updated: Client = {
			slug,
			sha,
			name: data.name,
			type: data.type,
			contact: data.contact,
			email: data.email,
			phone: data.phone,
			website: data.website,
			address: data.address,
			hourlyRate: data.hourlyRate,
			status: data.status,
			since: data.since,
			notes: data.notes,
		};
		setClients((prev) =>
			prev.some((c) => c.slug === slug)
				? prev.map((c) => (c.slug === slug ? updated : c))
				: [...prev, updated],
		);
		if (project.client === slug) setLinkedClient(updated);
		setClientEditTarget(updated);
	};

	const visibleTasks = tasks.filter((t) => taskMatchesProject(t, project));
	const statusText = statusLabel(project.status);
	const displayBody = projectBodyForDisplay(project.body);
	const clientLabel = linkedClient?.name ?? project.clientName;
	const canOpenClient = Boolean(linkedClient || project.client);

	return (
		<>
			<EntityDetailPageLayout
				listLabel="Projekte"
				listHref={projectsListPath(workspaceSlug)}
				title={project.title}
				badges={
					<>
						<Badge className={`text-xs ${TYPE_COLORS[project.type] ?? ""}`}>
							{TYPE_LABELS[project.type] ?? project.type}
						</Badge>
						{statusText ? (
							<Badge variant="outline" className="text-xs">
								{statusText}
							</Badge>
						) : null}
					</>
				}
				sha={project.sha}
				deleteDialogTitle="Projekt löschen?"
				editAriaLabel="Projekt bearbeiten"
				deleteAriaLabel="Projekt löschen"
				onDelete={handleDelete}
				maxWidthClass="max-w-[700px]"
				details={
					<DetailFieldsGrid>
						{project.date ? (
							<TextDetailField label="Datum" value={project.date} />
						) : null}
						{clientLabel ? (
							<DetailField label="Kunde">
								{canOpenClient && linkedClient ? (
									<Link
										href={clientDetailPath(workspaceSlug, linkedClient.slug)}
										className="hover:underline font-medium"
									>
										{clientLabel}
									</Link>
								) : canOpenClient ? (
									<button
										type="button"
										onClick={openClientDrawer}
										className="hover:underline text-left font-medium"
									>
										{clientLabel}
									</button>
								) : (
									<span>{clientLabel}</span>
								)}
							</DetailField>
						) : null}
						{project.category.length > 0 ? (
							<DetailField label="Kategorien" className="sm:col-span-2">
								<div className="flex flex-wrap gap-1">
									{project.category.map((c) => (
										<Badge key={c} variant="outline">
											{c}
										</Badge>
									))}
								</div>
							</DetailField>
						) : null}
						{project.skills.length > 0 ? (
							<DetailField label="Skills">
								<div className="flex flex-wrap gap-1">
									{project.skills.map((s) => (
										<Badge key={s} variant="secondary">
											{s}
										</Badge>
									))}
								</div>
							</DetailField>
						) : null}
						{project.tools.length > 0 ? (
							<DetailField label="Tools">
								<span>{project.tools.join(" · ")}</span>
							</DetailField>
						) : null}
						{project.area.length > 0 ? (
							<DetailField label="Bereiche">
								<span>{project.area.join(" · ")}</span>
							</DetailField>
						) : null}
						{displayBody ? (
							<TextDetailField
								label="Beschreibung"
								value={displayBody}
								className="sm:col-span-2"
								prose
							/>
						) : null}
					</DetailFieldsGrid>
				}
				fullWidthContent={
					<ProjectTasksSection
						projectKey={project.slug}
						tasks={visibleTasks}
						setTasks={(updater) => {
							setTasks((allTasks) => {
								const projectTasks =
									typeof updater === "function"
										? updater(
												allTasks.filter((t) => taskMatchesProject(t, project)),
											)
										: updater;
								const other = allTasks.filter(
									(t) => !taskMatchesProject(t, project),
								);
								return [...other, ...projectTasks];
							});
						}}
						members={members}
						kanbanFullWidth
						listMaxWidthClass="max-w-[700px]"
					/>
				}
				renderEditDrawer={({ open, onOpenChange }) => (
					<ProjectDetailView
						open={open}
						onOpenChange={onOpenChange}
						project={project}
						clients={clients}
						onSave={handleProjectSave}
					/>
				)}
			/>

			<ClientQuickDetailDrawer
				open={clientDrawerOpen}
				onOpenChange={setClientDrawerOpen}
				client={
					clientEditTarget
						? (clients.find((c) => c.slug === clientEditTarget.slug) ??
							clientEditTarget)
						: undefined
				}
				onSave={handleClientSave}
			/>
		</>
	);
}
