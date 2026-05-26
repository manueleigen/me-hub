import { listProductIdeas } from "@/app/actions/produkt-ideen";
import { ProduktIdeenView } from "@/components/produkt-ideen/produkt-ideen-view";

export async function ProduktIdeenPageContent() {
	const ideas = await listProductIdeas();
	return <ProduktIdeenView ideas={ideas} />;
}
