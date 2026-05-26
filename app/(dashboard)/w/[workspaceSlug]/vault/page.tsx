import type { Metadata } from "next";
import { Suspense } from "react";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata("Vault");
import { PageLoadingShell } from "@/components/loading/page-loading-shell";
import { VaultPageContent } from "@/app/(dashboard)/vault/vault-page-content";

export default function WorkspaceVaultPage() {
	return (
		<Suspense
			fallback={
				<PageLoadingShell breadcrumbs={[{ label: "Vault" }]} title="Vault" variant="vault" />
			}
		>
			<VaultPageContent />
		</Suspense>
	);
}
