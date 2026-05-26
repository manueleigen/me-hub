import { listClients } from "@/app/actions/clients";
import { ClientsView } from "@/components/clients/clients-view";

export async function ClientsPageContent() {
	const clients = await listClients();
	return <ClientsView clients={clients} />;
}
