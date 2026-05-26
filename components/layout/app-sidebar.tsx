"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	User,
	LogOut,
	Pause,
	Square,
	ExternalLink,
	Settings,
	ShieldAlert,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDashboardUser } from "@/lib/dashboard-user-context";
import { useWorkspace } from "@/lib/workspace-context";
import { zeiterfassungPath } from "@/lib/workspace-paths";
import { signOut } from "@/lib/auth-client";
import { useTimerContext } from "@/lib/timer-context";
import { DonutTimer } from "@/components/zeiterfassung/donut-timer";
import { WorkspaceSelector } from "@/components/layout/workspace-selector";
import { WorkspaceNav } from "@/components/layout/workspace-nav";
import Image from "next/image";

function MiniTimerWidget({ workspaceSlug }: { workspaceSlug: string | undefined }) {
	const { status, hours, minutes, seconds, segments, pause, resume, stop, formData } =
		useTimerContext();

	if (status === "idle") return null;

	const isRunning = status === "running";
	const isPaused = status === "paused";

	return (
		<div className="px-2 py-2 group-data-[collapsible=icon]:px-0">
			<div className="rounded-lg border bg-card p-2 space-y-2 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
				<div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
					<DonutTimer
						mini
						segments={segments}
						hours={hours}
						minutes={minutes}
						seconds={seconds}
						goalHours={formData.goalHours}
						isRunning={isRunning}
						isPaused={isPaused}
					/>
					<div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
						<div className="text-xs font-medium truncate">
							{formData.projectName || "Aktive Session"}
						</div>
						{formData.clientName && (
							<div className="text-xs text-muted-foreground truncate">
								{formData.clientName}
							</div>
						)}
					</div>
				</div>

				<div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
					{isRunning ? (
						<Button
							size="sm"
							variant="outline"
							className="flex-1 h-7 text-xs border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-400"
							onClick={pause}
						>
							<Pause className="size-3 mr-1" />
							Pause
						</Button>
					) : (
						<Button
							size="sm"
							variant="outline"
							className="flex-1 h-7 text-xs border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-500"
							onClick={resume}
						>
							Weiter
						</Button>
					)}
					<Button
						size="sm"
						variant="outline"
						className="h-7 w-7 p-0 border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
						onClick={stop}
					>
						<Square className="size-3" />
					</Button>
					<Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
						<Link href={zeiterfassungPath(workspaceSlug)}>
							<ExternalLink className="size-3" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

export function AppSidebar() {
	const router = useRouter();
	const user = useDashboardUser();
	const ctx = useWorkspace();

	const handleSignOut = async () => {
		await signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
	};

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="items-center justify-center gap-1">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild tooltip="MeHub">
							<Link
								href={ctx ? `/w/${ctx.workspace.slug}` : "/"}
								className="grid h-full w-full place-items-center text-center"
							>
								<Image
									src="/logo_001.png"
									alt="MeHub Logo"
									width={150}
									height={150}
									className="h-auto w-full max-w-[140px] group-data-[collapsible=icon]:max-w-8"
									loading="eager"
								/>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					{ctx ? (
						<SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
							<WorkspaceSelector />
						</SidebarMenuItem>
					) : null}
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{ctx ? (
					<>
						<SidebarSeparator />
						<WorkspaceNav
							pages={ctx.workspace.pages}
							navSections={ctx.workspace.navSections}
							workspaceSlug={ctx.workspace.slug}
						/>
						<SidebarSeparator />
					</>
				) : null}

				{/* Always-visible settings group */}
				<SidebarGroup>
					<SidebarGroupLabel>Einstellungen</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{ctx && (
								<>
									<SidebarMenuItem>
										<SidebarMenuButton asChild tooltip="Workspace-Einstellungen">
											<Link href={`/w/${ctx.workspace.slug}/settings/general`} prefetch={false}>
												<Settings className="size-4" />
												<span>Workspace</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</>
							)}
							<SidebarMenuItem>
								<SidebarMenuButton asChild tooltip="Profil">
									<Link href="/profil" prefetch={false}>
										<User className="size-4" />
										<span>Profil</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							{user?.isPlatformAdmin && (
								<SidebarMenuItem>
									<SidebarMenuButton asChild tooltip="Admin">
										<Link href="/admin/users" prefetch={false}>
											<ShieldAlert className="size-4" />
											<span>Admin</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<MiniTimerWidget workspaceSlug={ctx?.workspace.slug} />

				<SidebarMenu>
					<SidebarMenuItem>
						{user && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton tooltip="Benutzer">
										<div className="flex aspect-square size-6 items-center justify-center rounded-full bg-muted overflow-hidden shrink-0">
											{user.image ? (
												<Image
													src={user.image}
													width={24}
													height={24}
													alt="Profil"
													className="aspect-square size-full object-cover"
												/>
											) : (
												<User className="size-3" />
											)}
										</div>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-medium">
												{user.name || "Benutzer"}
											</span>
											<span className="truncate text-xs text-muted-foreground">
												{user.email}
											</span>
										</div>
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent side="top" align="start" className="w-52">
									<DropdownMenuLabel className="font-normal">
										<p className="text-sm font-medium truncate">
											{user.name || "Benutzer"}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{user.email}
										</p>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/profil" prefetch={false}>
											<User className="size-4 mr-2" />
											Profil
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleSignOut}>
										<LogOut className="size-4 mr-2" />
										Abmelden
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
