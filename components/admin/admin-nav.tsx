"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
	{ href: "/admin/users", label: "Nutzer" },
	{ href: "/admin/roles", label: "Rollen" },
	{ href: "/admin/invitations", label: "Einladungen" },
] as const;

export function AdminNav() {
	const pathname = usePathname();

	return (
		<nav className="border-b px-6 pt-4">
			<ul className="flex flex-wrap gap-1">
				{ADMIN_NAV.map((item) => {
					const active =
						pathname === item.href || pathname.startsWith(`${item.href}/`);
					return (
						<li key={item.href}>
							<Link
								href={item.href}
								prefetch={false}
								className={cn(
									"inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
