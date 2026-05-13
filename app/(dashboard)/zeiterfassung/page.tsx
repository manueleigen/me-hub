import { listOpenEntries } from "@/app/actions/zeiterfassung";
import { listProjects } from "@/app/actions/projects";
import { listClients } from "@/app/actions/clients";
import { ZeiterfassungView } from "@/components/zeiterfassung/zeiterfassung-view";

export const dynamic = "force-dynamic";

export default async function ZeiterfassungPage() {
  const [openEntries, projects, clients] = await Promise.all([
    listOpenEntries(),
    listProjects(),
    listClients(),
  ]);
  return (
    <ZeiterfassungView
      openEntries={openEntries}
      projects={projects}
      clients={clients}
    />
  );
}
