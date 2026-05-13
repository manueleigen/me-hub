import { listProjects } from "@/app/actions/projects";
import { listClients } from "@/app/actions/clients";
import { ProjectsView } from "@/components/projects/projects-view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([listProjects(), listClients()]);
  return <ProjectsView projects={projects} clients={clients} />;
}
