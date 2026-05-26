"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	Mail,
	Phone,
	Globe,
	MapPin,
	FolderKanban,
	Clock,
	Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/entity-detail/detail-field";
import { EntityDetailPageLayout } from "@/components/entity/entity-detail-page-layout";
import { DetailFieldsGrid, TextDetailField } from "@/components/entity/detail-fields";
import {
	LinkedRow,
	LinkedSectionCard,
} from "@/components/entity/linked-section-card";
import { ClientQuickDetailDrawer } from "@/components/clients/client-quick-detail-drawer";
import { saveClient, deleteClient } from "@/app/actions/clients";
import { useWorkspace } from "@/lib/workspace-context";
import {
	clientDetailPath,
	clientsListPath,
	projectDetailPath,
	projectsListPath,
	workspaceModulePath,
} from "@/lib/workspace-paths";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import {
	isOpenProject,
	sortProjectsByDateDesc,
} from "@/lib/entity/modules/projects";
import type { Client, ClientFrontmatter } from "@/types/clients";
import type { Project } from "@/types/projects";
import type { VaultTimeEntry } from "@/types/zeiterfassung";

const PREVIEW_LIMIT = 3;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
	active: {
		label: "Aktiv",
		className:
			"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
	},
	prospect: {
		label: "Interessent",
		className:
			"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
	},
	inactive: {
		label: "Inaktiv",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
	},
};

const TYPE_LABELS: Record<string, string> = {
	company: "Unternehmen",
	agency: "Agentur",
	ngo: "NGO",
	individual: "Privatperson",
	startup: "Startup",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
	planning: "Planung",
	"in-progress": "In Arbeit",
	review: "Review",
	completed: "Abgeschlossen",
	"on-hold": "Pausiert",
	active: "Aktiv",
	draft: "Entwurf",
};

interface ClientDetailViewProps {
	client: Client;
	projects: Project[];
	timeEntries: VaultTimeEntry[];
}

export function ClientDetailView({
	client: initialClient,
	projects,
	timeEntries,
}: ClientDetailViewProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const workspaceSlug = useWorkspace()?.workspace.slug;
	const router = useRouter();

	const [client, setClient] = useState(initialClient);

	useEffect(() => {
		setClient(initialClient);
	}, [initialClient]);

	const handleSave = async (
		slug: string,
		data: ClientFrontmatter,
		sha?: string,
	) => {
		await saveClient(slug, data, sha ?? client.sha);
		const saved: Client = {
			slug,
			sha: client.sha,
			name: data.name,
			type: data.type,
			contact: data.contact,
			email: data.email,
			phone: data.phone,
			website: data.website,
			address: data.address,
			hourlyRate: data.hourlyRate,
			status: data.status,
			since: data.since,
			notes: data.notes,
		};
		setClient(saved);
		if (slug !== client.slug) {
			router.replace(clientDetailPath(workspaceSlug, slug));
		} else {
			router.refresh();
		}
	};

	const handleDelete = async () => {
		if (!client.sha) return;
		await deleteClient(client.slug, client.sha);
		toast.success("Kunde gelöscht");
		router.push(clientsListPath(workspaceSlug));
	};

	const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.inactive;
	const totalOpenHours = timeEntries.reduce((s, e) => s + e.hours, 0);
	const totalOpenRevenue = timeEntries
		.filter((e) => e.billable)
		.reduce((s, e) => s + e.hours * e.rate, 0);
	const zeiterfassungHref = `${workspaceModulePath(workspaceSlug, "zeiterfassung")}?client=${client.slug}`;
	const projectsForClientHref = `${projectsListPath(workspaceSlug)}?client=${client.slug}`;

	const openProjects = useMemo(
		() =>
			projects.filter(isOpenProject).sort(sortProjectsByDateDesc),
		[projects],
	);

	const sortedTimeEntries = useMemo(
		() => [...timeEntries].sort((a, b) => b.date.localeCompare(a.date)),
		[timeEntries],
	);

	return (
		<EntityDetailPageLayout
			listLabel="Kunden"
			listHref={clientsListPath(workspaceSlug)}
			title={client.name}
			badges={
				<>
					<Badge className={`text-xs ${statusCfg.className}`}>
						{statusCfg.label}
					</Badge>
					{client.type ? (
						<Badge variant="outline" className="text-xs">
							{TYPE_LABELS[client.type] ?? client.type}
						</Badge>
					) : null}
				</>
			}
			sha={client.sha}
			deleteDialogTitle="Kunde löschen?"
			editAriaLabel="Kunde bearbeiten"
			deleteAriaLabel="Kunde löschen"
			onDelete={handleDelete}
			details={
				<DetailFieldsGrid>
					{client.type ? (
						<DetailField label="Typ">
							{TYPE_LABELS[client.type] ?? client.type}
						</DetailField>
					) : null}
					<DetailField label="Status">
						<Badge className={`text-xs ${statusCfg.className}`}>
							{statusCfg.label}
						</Badge>
					</DetailField>
					{client.contact ? (
						<DetailField label="Ansprechpartner">{client.contact}</DetailField>
					) : null}
					{client.email ? (
						<DetailField label="E-Mail">
							<a
								href={`mailto:${client.email}`}
								className="inline-flex items-center gap-1.5 hover:underline"
							>
								<Mail className="size-3.5 text-muted-foreground shrink-0" />
								{client.email}
							</a>
						</DetailField>
					) : null}
					{client.phone ? (
						<DetailField label="Telefon">
							<a
								href={`tel:${client.phone}`}
								className="inline-flex items-center gap-1.5 hover:underline"
							>
								<Phone className="size-3.5 text-muted-foreground shrink-0" />
								{client.phone}
							</a>
						</DetailField>
					) : null}
					{client.website ? (
						<DetailField label="Website">
							<a
								href={client.website}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 hover:underline truncate"
							>
								<Globe className="size-3.5 text-muted-foreground shrink-0" />
								<span className="truncate">{client.website}</span>
							</a>
						</DetailField>
					) : null}
					{client.hourlyRate ? (
						<DetailField label="Stundensatz">
							{client.hourlyRate} EUR/h
						</DetailField>
					) : null}
					{client.since ? (
						<DetailField label="Kunde seit">
							{new Date(client.since + "T00:00:00").toLocaleDateString("de-DE")}
						</DetailField>
					) : null}
					{client.address ? (
						<DetailField label="Adresse" className="sm:col-span-2">
							<span className="inline-flex items-start gap-1.5 whitespace-pre-line">
								<MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
								{client.address}
							</span>
						</DetailField>
					) : null}
					{client.notes ? (
						<TextDetailField
							label="Notizen"
							value={client.notes}
							className="sm:col-span-2"
						/>
					) : null}
				</DetailFieldsGrid>
			}
			narrowContent={
				<>
					<LinkedSectionCard
						title={`Projekte (${openProjects.length})`}
						icon={<FolderKanban className="size-4" />}
						linkHref={projectsForClientHref}
						linkLabel="Alle Projekte"
						emptyMessage="Keine offenen Projekte."
						items={openProjects}
						previewLimit={PREVIEW_LIMIT}
						showAllHref={projectsForClientHref}
						showAllLabel="Alle Projekte"
						footerHint={
							<>
								Alle Kundenprojekte in der{" "}
								<Link
									href={projectsForClientHref}
									className="underline underline-offset-2 hover:text-foreground"
								>
									Projektübersicht
								</Link>{" "}
								(Filter: Kunde).
							</>
						}
						getItemKey={(p) => p.slug}
						headerActions={
							<Link
								href={
									vaultWriteEnabled
										? `${projectsListPath(workspaceSlug)}/new?client=${client.slug}`
										: "#"
								}
								aria-disabled={!vaultWriteEnabled}
								tabIndex={vaultWriteEnabled ? undefined : -1}
							>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 text-xs"
									disabled={!vaultWriteEnabled}
								>
									<Plus className="size-3.5 mr-1" />
									Projekt hinzufügen
								</Button>
							</Link>
						}
						renderItem={(project) => (
							<LinkedRow
								href={projectDetailPath(workspaceSlug, project.slug)}
								title={project.title}
								subtitle={
									project.status
										? (PROJECT_STATUS_LABELS[project.status] ?? project.status)
										: undefined
								}
							/>
						)}
					/>

					<LinkedSectionCard
						title={
							<>
								Offene Stunden
								{timeEntries.length > 0 && (
									<span className="text-muted-foreground font-normal text-sm ml-1">
										{totalOpenHours.toFixed(1)}h
										{totalOpenRevenue > 0 &&
											` · ${totalOpenRevenue.toFixed(0)} EUR`}
									</span>
								)}
							</>
						}
						icon={<Clock className="size-4" />}
						linkHref={zeiterfassungHref}
						linkLabel="Zur Zeiterfassung"
						emptyMessage="Keine offenen Stunden."
						items={sortedTimeEntries}
						previewLimit={PREVIEW_LIMIT}
						showAllHref={zeiterfassungHref}
						showAllLabel="Alle anzeigen"
						getItemKey={(e) => e.slug}
						renderItem={(entry) => (
							<div className="flex items-center justify-between rounded-md border px-3 py-2">
								<div className="min-w-0">
									<p className="text-sm font-medium truncate">
										{entry.projectName}
									</p>
									<p className="text-xs text-muted-foreground">
										{entry.date}
										{entry.description && ` · ${entry.description}`}
									</p>
								</div>
								<div className="text-right text-sm shrink-0 ml-2">
									<p className="font-medium">{entry.hours}h</p>
									{entry.billable && (
										<p className="text-xs text-muted-foreground">
											{(entry.hours * entry.rate).toFixed(0)} EUR
										</p>
									)}
								</div>
							</div>
						)}
					/>
				</>
			}
			renderEditDrawer={({ open, onOpenChange }) => (
				<ClientQuickDetailDrawer
					open={open}
					onOpenChange={onOpenChange}
					client={client}
					onSave={handleSave}
				/>
			)}
		/>
	);
}
