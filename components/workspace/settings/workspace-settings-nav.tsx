"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
	{ segment: "general", label: "Allgemein", requiresAdmin: false },
	{ segment: "users", label: "Nutzer", requiresAdmin: false },
	{ segment: "pages", label: "Seiten", requiresAdmin: false },
	{ segment: "github", label: "GitHub Sync", requiresAdmin: true },
	{ segment: "mcp", label: "MCP-Konfiguration", requiresAdmin: true },
] as const;

export function WorkspaceSettingsNav({
	workspaceSlug,
	canEdit,
}: {
	workspaceSlug: string;
	canEdit: boolean;
}) {
	const pathname = usePathname();
	const base = `/w/${workspaceSlug}/settings`;

	const items = SETTINGS_NAV.filter((item) => canEdit || !item.requiresAdmin);

	return (
		<nav className="w-48 shrink-0 border-r pr-4">
			<ul className="space-y-0.5">
				{items.map((item) => {
					const href = `${base}/${item.segment}`;
					const active =
						pathname === href || pathname.startsWith(`${href}/`);
					return (
						<li key={item.segment}>
							<Link
								href={href}
								prefetch={false}
								className={cn(
									"block rounded-md px-3 py-2 text-sm font-medium transition-colors",
									active
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								{item.label}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
