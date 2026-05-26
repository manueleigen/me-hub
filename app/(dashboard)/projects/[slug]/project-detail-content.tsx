import { notFound } from "next/navigation";
import { loadProjectDetailPageData } from "@/lib/mirror/page-loaders";
import {
	listWorkspaceMembers,
	resolveActiveWorkspaceForUser,
} from "@/app/actions/workspaces";
import { ProjectDetailPageView } from "@/components/projects/project-detail-page-view";

export async function ProjectDetailContent({ slug }: { slug: string }) {
	const data = await loadProjectDetailPageData(slug);
	if (!data) notFound();

	const resolved = await resolveActiveWorkspaceForUser();
	const members = resolved
		? await listWorkspaceMembers(resolved.workspace.id)
		: [];

	return (
		<ProjectDetailPageView
			project={data.project}
			client={data.client}
			clients={data.clients}
			tasks={data.tasks}
			members={members}
		/>
	);
}
