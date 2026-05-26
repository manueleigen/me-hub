"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	FolderOpen,
	Clock,
	Lightbulb,
	ListTodo,
	FolderKanban,
	Users,
	type LucideIcon,
} from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import {
	useWorkspace,
	type WorkspaceNavSectionData,
	type WorkspacePageData,
} from "@/lib/workspace-context";

const ICON_MAP: Record<string, LucideIcon> = {
	FolderOpen,
	Clock,
	Lightbulb,
	ListTodo,
	FolderKanban,
	Users,
};

function NavItem({
	page,
	workspaceSlug,
	isActive,
}: {
	page: WorkspacePageData;
	workspaceSlug: string;
	isActive: boolean;
}) {
	const Icon = (page.icon && ICON_MAP[page.icon]) || FolderOpen;
	const href = `/w/${workspaceSlug}/${page.slug}`;

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={isActive} tooltip={page.label}>
				<Link href={href} prefetch={false}>
					<Icon className="size-4" />
					<span>{page.label}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

function NavSectionGroup({
	section,
	pages,
	workspaceSlug,
	isActive,
}: {
	section: WorkspaceNavSectionData | null;
	pages: WorkspacePageData[];
	workspaceSlug: string;
	isActive: (page: WorkspacePageData) => boolean;
}) {
	if (pages.length === 0) return null;

	return (
		<SidebarGroup>
			{section?.title ? <SidebarGroupLabel>{section.title}</SidebarGroupLabel> : null}
			<SidebarGroupContent>
				<SidebarMenu>
					{pages.map((p) => (
						<NavItem
							key={p.id}
							page={p}
							workspaceSlug={workspaceSlug}
							isActive={isActive(p)}
						/>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

export function WorkspaceNav({
	pages,
	navSections,
	workspaceSlug,
}: {
	pages: WorkspacePageData[];
	navSections: WorkspaceNavSectionData[];
	workspaceSlug: string;
}) {
	const ctx = useWorkspace();
	const pathname = usePathname();

	if (!ctx) return null;
	const base = `/w/${workspaceSlug}/`;
	const isActive = (page: WorkspacePageData) => pathname.startsWith(`${base}${page.slug}`);

	const sortedSections = [...navSections].sort((a, b) => a.order - b.order);
	const sectionIds = new Set(sortedSections.map((s) => s.id));
	const unsectioned = pages.filter((p) => !p.navSectionId || !sectionIds.has(p.navSectionId));

	const groups: { section: WorkspaceNavSectionData | null; pages: WorkspacePageData[] }[] = [];

	if (unsectioned.length > 0) {
		groups.push({ section: null, pages: unsectioned });
	}

	for (const section of sortedSections) {
		const sectionPages = pages.filter((p) => p.navSectionId === section.id);
		if (sectionPages.length > 0) {
			groups.push({ section, pages: sectionPages });
		}
	}

	if (groups.length === 0) return null;

	return (
		<>
			{groups.map((group, index) => (
				<div key={group.section?.id ?? "unsectioned"}>
					{index > 0 && <SidebarSeparator />}
					<NavSectionGroup
						section={group.section}
						pages={group.pages}
						workspaceSlug={workspaceSlug}
						isActive={isActive}
					/>
				</div>
			))}
		</>
	);
}
