import { loadProjectsPageData } from "@/lib/mirror/page-loaders";
import { ProjectsView } from "@/components/projects/projects-view";

export async function ProjectsPageContent() {
	const { projects, clients } = await loadProjectsPageData();
	return <ProjectsView projects={projects} clients={clients} />;
}
