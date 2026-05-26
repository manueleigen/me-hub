"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LayoutGrid, Plus, Settings } from "lucide-react";
import { setActiveWorkspace } from "@/app/actions/workspaces";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useWorkspace, type WorkspaceSummary } from "@/lib/workspace-context";

const WORKSPACE_PATH_SUFFIX = /^\/w\/[^/]+(\/.*)?$/;

function WorkspaceIcon() {
	return <LayoutGrid className="size-4 shrink-0 text-muted-foreground" />;
}

export function WorkspaceSelector() {
	const ctx = useWorkspace();
	const router = useRouter();
	const pathname = usePathname();

	if (!ctx) return null;

	const { workspace, allWorkspaces } = ctx;

	const handleSelect = (ws: WorkspaceSummary) => {
		if (ws.slug === workspace.slug) return;

		const suffix = pathname.match(WORKSPACE_PATH_SUFFIX)?.[1] ?? "";
		void setActiveWorkspace(ws.id);
		router.push(`/w/${ws.slug}${suffix}`);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton
					size="lg"
					className="h-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					tooltip={workspace.name}
				>
					<WorkspaceIcon />
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-semibold">{workspace.name}</span>
					</div>
					<ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
				</SidebarMenuButton>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				className="w-56 rounded-lg"
				align="start"
				side="bottom"
				sideOffset={4}
			>
				<DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
				<DropdownMenuGroup>
					{allWorkspaces.map((ws) => (
						<DropdownMenuItem key={ws.id} onSelect={() => handleSelect(ws)}>
							<LayoutGrid className="size-4 mr-2 shrink-0" />
							<span className="truncate">{ws.name}</span>
							{ws.slug === workspace.slug && <Check className="ml-auto size-4" />}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={() => router.push(`/w/${workspace.slug}/settings/general`)}>
					<Settings className="size-4 mr-2" />
					Workspace-Einstellungen
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={() => router.push("/workspaces")}>
					<Plus className="size-4 mr-2" />
					Workspaces verwalten
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
