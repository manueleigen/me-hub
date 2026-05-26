import { loadZeiterfassungShellData } from "@/lib/mirror/page-loaders";
import { ZeiterfassungView } from "@/components/zeiterfassung/zeiterfassung-view";

export async function ZeiterfassungPageContent() {
	const { projects, clients } = await loadZeiterfassungShellData();
	return <ZeiterfassungView projects={projects} clients={clients} />;
}
