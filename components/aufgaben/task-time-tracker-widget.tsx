"use client";

import { useMemo } from "react";
import { TimeTrackerWidget } from "@/components/zeiterfassung/time-tracker-widget";
import { findProjectForTask } from "@/lib/projects/task-match";
import type { Task } from "@/types/aufgaben";
import type { Project } from "@/types/projects";
import type { Client } from "@/types/clients";

type TaskTimeTrackerWidgetProps = {
	task: Task;
	projects: Project[];
	clients: Client[];
};

export function TaskTimeTrackerWidget({
	task,
	projects,
	clients,
}: TaskTimeTrackerWidgetProps) {
	const linkedProject = findProjectForTask(task, projects);
	const linkedClient = linkedProject?.client
		? clients.find((c) => c.slug === linkedProject.client)
		: undefined;

	const prefill = useMemo(() => {
		const description = task.title.trim();
		if (linkedProject) {
			return {
				projectSlug: linkedProject.slug,
				projectName: linkedProject.title,
				clientSlug: linkedClient?.slug ?? "",
				clientName: linkedClient?.name ?? linkedProject.clientName ?? "",
				description,
				hourlyRate: linkedClient?.hourlyRate,
			};
		}
		if (task.project?.trim()) {
			return {
				projectSlug: "",
				projectName: task.project.trim(),
				description,
			};
		}
		return { description };
	}, [task.slug, task.title, task.project, linkedProject, linkedClient]);

	return (
		<TimeTrackerWidget
			projects={projects}
			clients={clients}
			prefill={prefill}
			prefillKey={task.slug}
			size="compact"
			layout="inline"
			showDescription={false}
			title=""
		/>
	);
}
