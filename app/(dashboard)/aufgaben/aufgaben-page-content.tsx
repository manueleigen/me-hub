import { listTasks } from "@/app/actions/aufgaben";
import {
	listWorkspaceMembers,
	resolveActiveWorkspaceForUser,
	resolveWorkspaceForUser,
} from "@/app/actions/workspaces";
import { AufgabenView } from "@/components/aufgaben/aufgaben-view";

export async function AufgabenPageContent({
	workspaceSlug,
	pageSlug = "aufgaben",
	tasksFolder = "tasks",
	pageLabel,
}: {
	workspaceSlug?: string;
	pageSlug?: string;
	tasksFolder?: string;
	pageLabel?: string;
} = {}) {
	const tasks = await listTasks(tasksFolder);
	const resolved = workspaceSlug
		? await resolveWorkspaceForUser(workspaceSlug)
		: await resolveActiveWorkspaceForUser();
	const members = resolved
		? await listWorkspaceMembers(resolved.workspace.id)
		: [];

	return (
		<AufgabenView
			tasks={tasks}
			members={members}
			pageSlug={pageSlug}
			tasksFolder={tasksFolder}
			pageLabel={pageLabel}
		/>
	);
}
