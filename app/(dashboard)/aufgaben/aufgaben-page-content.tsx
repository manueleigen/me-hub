import { listTasks } from "@/app/actions/aufgaben";
import {
	listWorkspaceMembers,
	resolveActiveWorkspaceForUser,
	resolveWorkspaceForUser,
} from "@/app/actions/workspaces";
import { AufgabenView } from "@/components/aufgaben/aufgaben-view";

export async function AufgabenPageContent({
	workspaceSlug,
}: {
	workspaceSlug?: string;
} = {}) {
	const tasks = await listTasks();
	const resolved = workspaceSlug
		? await resolveWorkspaceForUser(workspaceSlug)
		: await resolveActiveWorkspaceForUser();
	const members = resolved
		? await listWorkspaceMembers(resolved.workspace.id)
		: [];

	return <AufgabenView tasks={tasks} members={members} />;
}
