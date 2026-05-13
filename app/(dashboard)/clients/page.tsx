import { listClients } from "@/app/actions/clients";
import { ClientsView } from "@/components/clients/clients-view";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await listClients();
  return <ClientsView clients={clients} />;
}
