import { notFound } from "next/navigation";
import { loadTaskDetailPageData } from "@/lib/mirror/page-loaders";
import {
	listWorkspaceMembers,
	resolveActiveWorkspaceForUser,
} from "@/app/actions/workspaces";
import { TaskDetailPageView } from "@/components/aufgaben/task-detail-page-view";

export async function TaskDetailContent({
	slug,
	tasksFolder = "tasks",
	pageSlug = "aufgaben",
	pageLabel,
}: {
	slug: string;
	tasksFolder?: string;
	pageSlug?: string;
	pageLabel?: string;
}) {
	const data = await loadTaskDetailPageData(slug, tasksFolder);
	if (!data) notFound();

	const resolved = await resolveActiveWorkspaceForUser();
	const members = resolved
		? await listWorkspaceMembers(resolved.workspace.id)
		: [];

	return (
		<TaskDetailPageView
			task={data.task}
			project={data.project}
			relatedTasks={data.relatedTasks}
			projects={data.projects}
			clients={data.clients}
			members={members}
			tasksFolder={tasksFolder}
			pageSlug={pageSlug}
			pageLabel={pageLabel}
		/>
	);
}
