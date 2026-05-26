"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useVaultLink } from "@/lib/vault-link-context";

export function VaultSetupBanner() {
	const pathname = usePathname();
	const { vaultLinked, settingsHref } = useVaultLink();

	if (vaultLinked) return null;
	if (pathname.includes("/settings")) return null;

	return (
		<div
			role="status"
			className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-950 dark:text-amber-100"
		>
			<div className="mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
				<AlertCircle className="size-4 shrink-0" aria-hidden />
				<span>
					<strong>GitHub-Vault nicht verknüpft.</strong> Einträge können erst
					erstellt werden, wenn ein Repository in den Einstellungen hinterlegt ist.
				</span>
				<Link
					href={settingsHref}
					className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-white"
				>
					Zu den Einstellungen
				</Link>
			</div>
		</div>
	);
}
