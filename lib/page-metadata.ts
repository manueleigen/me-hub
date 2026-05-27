import type { Metadata } from "next";
import { appConfig } from "@/lib/config";
import {
	loadClientDetailPageData,
	loadIdeaDetailPageData,
	loadProjectDetailPageData,
	loadTaskDetailPageData,
} from "@/lib/mirror/page-loaders";
import {
	resolveActiveWorkspaceForUser,
	resolveWorkspaceForUser,
} from "@/app/actions/workspaces";

/** Separator between multiple page segments in the document title. */
export const PAGE_TITLE_SEGMENT_SEPARATOR = " · ";

export function joinPageTitleSegments(segments: string[]): string {
	return segments.filter((s) => s.trim().length > 0).join(PAGE_TITLE_SEGMENT_SEPARATOR);
}

/**
 * Full document title: `MeHub - Page · Detail (Workspace)`.
 * Omit workspace to skip the parenthetical.
 */
export function buildPageTitle(
	segments: string | string[],
	workspaceName?: string | null,
): string {
	const pagePart = joinPageTitleSegments(
		Array.isArray(segments) ? segments : [segments],
	);
	const base = pagePart ? `${appConfig.name} - ${pagePart}` : appConfig.name;
	const workspace = workspaceName?.trim();
	return workspace ? `${base} (${workspace})` : base;
}

/** Layout template for child `title` segments (used with `childPageMetadata`). */
export function pageTitleTemplate(workspaceName?: string | null): string {
	const workspace = workspaceName?.trim();
	return workspace
		? `${appConfig.name} - %s (${workspace})`
		: `${appConfig.name} - %s`;
}

/** Sets the full document title (ignores parent templates). */
export function createPageMetadata(
	segments: string | string[],
	workspaceName?: string | null,
): Metadata {
	return {
		title: {
			absolute: buildPageTitle(segments, workspaceName),
		},
	};
}

/** Child route title segments; combined with the nearest layout `title.template`. */
export function childPageMetadata(segments: string | string[]): Metadata {
	const pagePart = joinPageTitleSegments(
		Array.isArray(segments) ? segments : [segments],
	);
	return pagePart ? { title: pagePart } : {};
}

export function detailPageMetadata(
	moduleLabel: string,
	entityTitle: string | null | undefined,
	slug: string,
): Metadata {
	return childPageMetadata([moduleLabel, entityTitle?.trim() || slug]);
}

export async function resolveWorkspaceName(
	workspaceSlug?: string,
): Promise<string | null> {
	if (workspaceSlug) {
		const resolved = await resolveWorkspaceForUser(workspaceSlug);
		return resolved?.workspace.name ?? null;
	}
	const active = await resolveActiveWorkspaceForUser();
	return active?.workspace.name ?? null;
}

export async function createDashboardLayoutMetadata(): Promise<Metadata> {
	const workspaceName = await resolveWorkspaceName();
	return {
		title: {
			template: pageTitleTemplate(workspaceName),
			default: buildPageTitle("Dashboard", workspaceName),
		},
	};
}

export async function createWorkspaceLayoutMetadata(
	workspaceSlug: string,
): Promise<Metadata> {
	const workspaceName = await resolveWorkspaceName(workspaceSlug);
	return {
		title: {
			template: pageTitleTemplate(workspaceName),
			default: buildPageTitle("Dashboard", workspaceName),
		},
	};
}

export const shellLayoutMetadata: Metadata = {
	title: {
		template: pageTitleTemplate(),
		default: appConfig.name,
	},
};

export const authLayoutMetadata: Metadata = {
	title: {
		template: pageTitleTemplate(),
		default: appConfig.name,
	},
};

export async function generateTaskDetailMetadata(
	slug: string,
	tasksFolder?: string,
): Promise<Metadata> {
	const data = await loadTaskDetailPageData(slug, tasksFolder);
	return detailPageMetadata("Aufgaben", data?.task.title, slug);
}

export async function generateProjectDetailMetadata(slug: string): Promise<Metadata> {
	const data = await loadProjectDetailPageData(slug);
	return detailPageMetadata("Projekte", data?.project.title, slug);
}

export async function generateClientDetailMetadata(slug: string): Promise<Metadata> {
	const data = await loadClientDetailPageData(slug);
	return detailPageMetadata("Kunden", data?.client.name, slug);
}

export async function generateIdeaDetailMetadata(
	categorySlug: string,
	slug: string,
): Promise<Metadata> {
	const data = await loadIdeaDetailPageData(categorySlug, slug);
	return detailPageMetadata("Produkt-Ideen", data?.idea.title, slug);
}

export function generateVaultPathMetadata(pathSegments: string[]): Metadata {
	if (pathSegments.length === 0) {
		return childPageMetadata("Vault");
	}
	const fileName = pathSegments.at(-1) ?? "Vault";
	return childPageMetadata(["Vault", fileName]);
}
