import { Suspense } from "react";
import { VaultLayoutContent } from "@/app/(dashboard)/vault/vault-layout-content";

export default function WorkspaceVaultLayout({ children }: { children: React.ReactNode }) {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
			}
		>
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<VaultLayoutContent>{children}</VaultLayoutContent>
			</div>
		</Suspense>
	);
}
