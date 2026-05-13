"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	LayoutDashboard,
	FolderOpen,
	Clock,
	Lightbulb,
	User,
	FolderKanban,
	Users,
	LogOut,
	Command,
	Search,
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
import { useUser } from "@/hooks/user";
import { signOut } from "@/lib/auth-client";
import Image from "next/image";

const mainNavItems = [
	{ title: "Dashboard", href: "/", icon: LayoutDashboard },
	{ title: "Vault", href: "/vault", icon: FolderOpen },
];

const ideenNavItems = [
	{ title: "Produkt-Ideen", href: "/produkt-ideen", icon: Lightbulb },
];

const arbeitNavItems = [
	{ title: "Kunden", href: "/clients", icon: Users },
	{ title: "Projekte", href: "/projects", icon: FolderKanban },
	{ title: "Zeiterfassung", href: "/zeiterfassung", icon: Clock },
];

const einstellungenNavItems = [
	{ title: "Profil", href: "/profil", icon: User },
];

export function AppSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const user = useUser();

	const isActive = (href: string) => {
		if (href === "/") return pathname === "/";
		return pathname.startsWith(href);
	};

	const handleSignOut = async () => {
		await signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
	};

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild></SidebarMenuButton>
						<Link href="/" className="grid justify-center text-center">
							<Image
								src="/logo_001.png"
								alt="MeHub Logo"
								width={150}
								height={150}
								style={{ width: "auto" }}
								loading="eager"
							/>
						</Link>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{/* Search not implemented yet
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<Button
									variant="outline"
									className="w-full justify-start gap-2 text-muted-foreground group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
								>
									<Search className="size-4" />
									<span className="group-data-[collapsible=icon]:hidden">
										Suchen...
									</span>
									<kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex group-data-[collapsible=icon]:hidden">
										<span className="text-xs">Ctrl</span>K
									</kbd>
								</Button>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				*/}
				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{mainNavItems.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										asChild
										isActive={isActive(item.href)}
										tooltip={item.title}
									>
										<Link href={item.href}>
											<item.icon className="size-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupLabel>Ideen</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{ideenNavItems.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										asChild
										isActive={isActive(item.href)}
										tooltip={item.title}
									>
										<Link href={item.href}>
											<item.icon className="size-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupLabel>Arbeit</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{arbeitNavItems.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										asChild
										isActive={isActive(item.href)}
										tooltip={item.title}
									>
										<Link href={item.href}>
											<item.icon className="size-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupLabel>Einstellungen</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{einstellungenNavItems.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										asChild
										isActive={isActive(item.href)}
										tooltip={item.title}
									>
										<Link href={item.href}>
											<item.icon className="size-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
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
										<Link href="/profil">
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
