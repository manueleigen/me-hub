import { notFound } from "next/navigation";
import { loadIdeaDetailPageData } from "@/lib/mirror/page-loaders";
import { IdeaDetailPageView } from "@/components/produkt-ideen/idea-detail-page-view";

export async function IdeaDetailContent({
	categorySlug,
	slug,
}: {
	categorySlug: string;
	slug: string;
}) {
	const data = await loadIdeaDetailPageData(categorySlug, slug);
	if (!data) notFound();

	return (
		<IdeaDetailPageView idea={data.idea} relatedIdeas={data.relatedIdeas} />
	);
}
