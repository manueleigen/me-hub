"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listClients } from "@/app/actions/clients";
import { isDraftSlug } from "@/lib/detail-drawer/constants";
import { CatalogListPage } from "@/components/entity/catalog-list-page";
import { useCatalogListState } from "@/components/entity/use-catalog-list-state";
import { ProjectCard } from "@/components/projects/project-card";
import {
	ProjectDetailView,
	createDraftProject,
} from "@/components/projects/project-detail-view";
import {
	saveProject,
	deleteProject,
	ensureSkillFiles,
} from "@/app/actions/projects";
import {
	projectFilterTabs,
	projectListLabels,
	projectMatchesFilter,
	projectMatchesSearch,
} from "@/lib/entity/modules/projects";
import type { Project, ProjectFrontmatter } from "@/types/projects";
import type { Client } from "@/types/clients";

export function ProjectsView({
	projects: initialProjects,
	clients: initialClients,
}: {
	projects: Project[];
	clients: Client[];
}) {
	const searchParams = useSearchParams();
	const clientSlugFromUrl = searchParams.get("client");
	const [filter, setFilter] = useState("all");
	const [clients, setClients] = useState(initialClients);

	const listState = useCatalogListState<Project>({
		initialItems: initialProjects,
		getItemKey: (p) => p.slug,
		getItemSha: (p) => p.sha,
		shouldSyncDetailTarget: (current, next) =>
			!current || current.slug === next.slug || isDraftSlug(current.slug),
		upsertItems: (items, optimistic, isUpdate) =>
			isUpdate
				? items.map((p) => (p.slug === optimistic.slug ? optimistic : p))
				: [...items, optimistic],
		findPreviousItem: (items, key) => items.find((p) => p.slug === key),
		persistItem: async (optimistic, sha) => {
			const data: ProjectFrontmatter = {
				type: optimistic.type,
				title: optimistic.title,
				client: optimistic.client,
				clientName: optimistic.clientName,
				category: optimistic.category,
				skills: optimistic.skills,
				tools: optimistic.tools,
				area: optimistic.area,
				status: optimistic.status,
				date: optimistic.date,
			};
			await saveProject(optimistic.slug, data, optimistic.body, sha);
			await ensureSkillFiles(data);
		},
		deleteItem: (project) => deleteProject(project.slug, project.sha!),
		deleteConfirmMessage: projectListLabels.deleteConfirm,
	});

	const refreshClients = async () => {
		try {
			setClients(await listClients());
		} catch {
			// keep existing list
		}
	};

	const filteredClient = useMemo(
		() =>
			clientSlugFromUrl
				? clients.find((c) => c.slug === clientSlugFromUrl)
				: undefined,
		[clients, clientSlugFromUrl],
	);

	const listItems = useMemo(() => {
		if (!clientSlugFromUrl) return listState.items;
		return listState.items.filter((p) => p.client === clientSlugFromUrl);
	}, [listState.items, clientSlugFromUrl]);

	const openCreate = () => {
		const draft = createDraftProject();
		if (clientSlugFromUrl && filteredClient) {
			draft.client = clientSlugFromUrl;
			draft.clientName = filteredClient.name;
		}
		listState.setDetailTarget(draft);
		void refreshClients();
		listState.setDetailOpen(true);
	};

	const openEdit = (project: Project) => {
		listState.setDetailTarget(project);
		void refreshClients();
		listState.setDetailOpen(true);
	};

	const handleSave = async (
		slug: string,
		data: ProjectFrontmatter,
		body: string,
		sha?: string,
	) => {
		const optimistic: Project = {
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
		await listState.persistWithOptimistic(optimistic, sha);
	};

	return (
		<CatalogListPage
			labels={
				filteredClient
					? {
							...projectListLabels,
							title: `Projekte · ${filteredClient.name}`,
							countLabel: (count) =>
								`${count} ${count === 1 ? "Projekt" : "Projekte"} für ${filteredClient.name}`,
						}
					: projectListLabels
			}
			items={listItems}
			isRefreshing={listState.isRefreshing}
			filterTabs={projectFilterTabs}
			filterValue={filter}
			onFilterChange={setFilter}
			matchFilter={(project, f) => projectMatchesFilter(project, f)}
			matchSearch={projectMatchesSearch}
			onCreate={openCreate}
			renderCard={(project) => (
				<ProjectCard
					key={project.slug}
					project={project}
					onEdit={() => openEdit(project)}
					onDelete={() => listState.handleDelete(project)}
				/>
			)}
			detailOpen={listState.detailOpen}
			onDetailOpenChange={(open) => {
				listState.setDetailOpen(open);
				if (open) void refreshClients();
			}}
			renderEditDrawer={({ open, onOpenChange }) => (
				<ProjectDetailView
					open={open}
					onOpenChange={onOpenChange}
					project={listState.resolveDetailItem(listState.detailTarget)}
					clients={clients}
					onSave={handleSave}
				/>
			)}
		/>
	);
}
