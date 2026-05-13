import { listProductIdeas } from "@/app/actions/produkt-ideen";
import { ProduktIdeenView } from "@/components/produkt-ideen/produkt-ideen-view";

export const dynamic = "force-dynamic";

export default async function ProduktIdeenPage() {
  const ideas = await listProductIdeas();
  return <ProduktIdeenView ideas={ideas} />;
}
