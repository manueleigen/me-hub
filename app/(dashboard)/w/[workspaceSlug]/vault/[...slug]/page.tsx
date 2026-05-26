import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoadingShell } from "@/components/loading/page-loading-shell";
import { generateVaultPathMetadata } from "@/lib/page-metadata";
import { VaultSlugPageContent } from "@/app/(dashboard)/vault/[...slug]/vault-slug-page-content";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
	const { slug } = await params;
	return generateVaultPathMetadata(slug);
}

export default async function WorkspaceVaultSlugPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string; slug: string[] }>;
}) {
	const { workspaceSlug, slug } = await params;

	return (
		<Suspense
			fallback={
				<PageLoadingShell
					breadcrumbs={[{ label: "Vault" }, { label: slug.at(-1) ?? "" }]}
					title={slug.at(-1) ?? ""}
					variant="detail"
				/>
			}
		>
			<VaultSlugPageContent slug={slug} workspaceSlug={workspaceSlug} />
		</Suspense>
	);
}
