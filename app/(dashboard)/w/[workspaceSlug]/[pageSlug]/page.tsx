import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { PageLoadingShell } from "@/components/loading/page-loading-shell";
import { childPageMetadata } from "@/lib/page-metadata";
import { ProduktIdeenPageContent } from "@/app/(dashboard)/produkt-ideen/produkt-ideen-page-content";
import { AufgabenPageContent } from "@/app/(dashboard)/aufgaben/aufgaben-page-content";
import { ProjectsPageContent } from "@/app/(dashboard)/projects/projects-page-content";
import { ZeiterfassungPageContent } from "@/app/(dashboard)/zeiterfassung/zeiterfassung-page-content";

// Map templateKey → the async content component
const TEMPLATE_COMPONENTS = {
	"produkt-ideen": { Component: ProduktIdeenPageContent, label: "Produkt-Ideen", variant: "stats" as const },
	aufgaben:         { Component: AufgabenPageContent,     label: "Aufgaben",       variant: "stats" as const },
	projects:         { Component: ProjectsPageContent,     label: "Projekte",        variant: "grid"  as const },
	zeiterfassung:    { Component: ZeiterfassungPageContent,label: "Zeiterfassung",   variant: "stats" as const },
};

export async function generateMetadata({
	params,
}: {
	params: Promise<{ workspaceSlug: string; pageSlug: string }>;
}): Promise<Metadata> {
	const { workspaceSlug, pageSlug } = await params;

	const session = await getAuthSession();
	if (!session?.user?.id) return {};

	const workspacePage = await prisma.workspacePage.findFirst({
		where: {
			slug: pageSlug,
			isEnabled: true,
			workspace: { slug: workspaceSlug },
		},
		select: { templateKey: true, label: true, workspaceId: true },
	});

	if (!workspacePage) return {};

	const member = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: { workspaceId: workspacePage.workspaceId, userId: session.user.id },
		},
	});
	if (!member) return {};

	const entry =
		TEMPLATE_COMPONENTS[workspacePage.templateKey as keyof typeof TEMPLATE_COMPONENTS];
	const displayLabel = workspacePage.label || entry?.label || pageSlug;
	return childPageMetadata(displayLabel);
}

export default async function WorkspaceTemplatePage({
	params,
}: {
	params: Promise<{ workspaceSlug: string; pageSlug: string }>;
}) {
	const { workspaceSlug, pageSlug } = await params;

	const session = await getAuthSession();
	if (!session?.user?.id) notFound();

	// Resolve the workspace page to get its templateKey
	const workspacePage = await prisma.workspacePage.findFirst({
		where: {
			slug: pageSlug,
			isEnabled: true,
			workspace: { slug: workspaceSlug },
		},
		select: { templateKey: true, label: true, workspaceId: true },
	});

	if (!workspacePage) notFound();

	const member = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: { workspaceId: workspacePage.workspaceId, userId: session.user.id },
		},
	});
	if (!member) notFound();

	const entry = TEMPLATE_COMPONENTS[workspacePage.templateKey as keyof typeof TEMPLATE_COMPONENTS];
	if (!entry) notFound();

	const { Component, label, variant } = entry;
	const displayLabel = workspacePage.label || label;

	return (
		<Suspense
			fallback={
				<PageLoadingShell
					breadcrumbs={[{ label: displayLabel }]}
					title={displayLabel}
					variant={variant}
				/>
			}
		>
			{workspacePage.templateKey === "aufgaben" ? (
				<AufgabenPageContent workspaceSlug={workspaceSlug} />
			) : (
				<Component />
			)}
		</Suspense>
	);
}
