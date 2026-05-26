"use client";

import { useState } from "react";
import { Plus, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ClientQuickDetailDrawer,
	createDraftClient,
} from "@/components/clients/client-quick-detail-drawer";
import {
	ProjectDetailView,
	createDraftProject,
} from "@/components/projects/project-detail-view";
import { saveClient } from "@/app/actions/clients";
import { saveProject, ensureSkillFiles } from "@/app/actions/projects";
import { useTimerContext } from "@/lib/timer-context";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import { cn } from "@/lib/utils";
import type { Project, ProjectFrontmatter } from "@/types/projects";
import type { Client, ClientFrontmatter } from "@/types/clients";

export type SessionFormPanelProps = {
	projects: Project[];
	clients: Client[];
	onClientsChange: (clients: Client[]) => void;
	onProjectsChange: (projects: Project[]) => void;
	onSave: () => void;
	onReset: () => void;
	hasData: boolean;
	isSaving: boolean;
	title?: string;
	showDescription?: boolean;
	compact?: boolean;
	/** Tighter fields when description is hidden (e.g. task embed) */
	dense?: boolean;
};

export function SessionFormPanel({
	projects,
	clients,
	onClientsChange,
	onProjectsChange,
	onSave,
	onReset,
	hasData,
	isSaving,
	title = "",
	showDescription = true,
	compact = false,
	dense = false,
}: SessionFormPanelProps) {
	const { formData, setFormData } = useTimerContext();
	const vaultWriteEnabled = useVaultWriteEnabled();
	const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
	const [clientTarget, setClientTarget] = useState<Client | undefined>();
	const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
	const [projectTarget, setProjectTarget] = useState<Project | undefined>();

	const selectedClient = clients.find((c) => c.slug === formData.clientSlug);
	const clientProjects = formData.clientSlug
		? projects.filter((p) => p.client === formData.clientSlug)
		: projects;

	const handleClientSave = async (
		slug: string,
		data: ClientFrontmatter,
		sha?: string,
	) => {
		await saveClient(slug, data, sha);
		const optimistic: Client = {
			slug,
			sha,
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
		onClientsChange(
			sha
				? clients.map((c) => (c.slug === slug ? optimistic : c))
				: [...clients, optimistic],
		);
		setFormData({
			clientSlug: slug,
			clientName: data.name,
			projectSlug: "",
			projectName: "",
			hourlyRate: data.hourlyRate ?? formData.hourlyRate,
		});
	};

	const handleProjectSave = async (
		slug: string,
		data: ProjectFrontmatter,
		body: string,
		sha?: string,
	) => {
		await saveProject(slug, data, body, sha);
		await ensureSkillFiles(data);
		const optimistic: Project = {
			slug,
			sha,
			body,
			type: data.type,
			title: data.title,
			client: data.client,
			clientName: data.clientName,
			category: data.category,
			skills: data.skills,
			tools: data.tools,
			area: data.area,
			status: data.status,
			date: data.date,
		};
		onProjectsChange(
			sha
				? projects.map((p) => (p.slug === slug ? optimistic : p))
				: [...projects, optimistic],
		);
		setFormData({
			projectSlug: slug,
			projectName: data.title,
			clientSlug: data.client ?? formData.clientSlug,
			clientName: data.clientName ?? formData.clientName,
		});
	};

	const fieldGap = dense ? "space-y-1" : compact ? "space-y-1.5" : "space-y-2";
	const labelClass = dense ? "text-xs" : undefined;
	const triggerClass = dense ? "h-8 text-xs" : undefined;
	const addBtnClass = dense ? "h-6 text-[10px] px-1.5" : "h-7 text-xs";

	return (
		<div className={dense ? "space-y-2" : compact ? "space-y-3" : "space-y-4"}>
			{title ? (
				<h3 className={compact ? "text-sm font-semibold" : "text-lg font-semibold"}>
					{title}
				</h3>
			) : null}

			<div className={fieldGap}>
				<div className="flex items-center justify-between gap-2">
					<Label className={labelClass}>Kunde</Label>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className={addBtnClass}
						onClick={() => {
							setClientTarget(createDraftClient());
							setClientDrawerOpen(true);
						}}
						disabled={!vaultWriteEnabled}
					>
						<Plus className="size-3 mr-1" />
						Kunde
					</Button>
				</div>
				<Select
					value={formData.clientSlug || undefined}
					onValueChange={(v) => {
						const client = clients.find((c) => c.slug === v);
						setFormData({
							clientSlug: v,
							clientName: client?.name ?? "",
							projectSlug: "",
							projectName: "",
							hourlyRate: client?.hourlyRate ?? formData.hourlyRate,
						});
					}}
				>
					<SelectTrigger className={cn("w-full", triggerClass)}>
						<SelectValue placeholder="Kunde auswählen…" />
					</SelectTrigger>
					<SelectContent position="popper" className="z-[100] max-h-60">
						{clients.length === 0 ? (
							<div className="px-2 py-4 text-sm text-muted-foreground text-center">
								Noch keine Kunden
							</div>
						) : (
							clients.map((c) => (
								<SelectItem key={c.slug} value={c.slug}>
									{c.name}
								</SelectItem>
							))
						)}
					</SelectContent>
				</Select>
			</div>

			<div className={fieldGap}>
				<div className="flex items-center justify-between gap-2">
					<Label className={labelClass}>Projekt</Label>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className={addBtnClass}
						onClick={() => {
							setProjectTarget(createDraftProject());
							setProjectDrawerOpen(true);
						}}
						disabled={!vaultWriteEnabled}
					>
						<Plus className="size-3 mr-1" />
						Projekt
					</Button>
				</div>
				<Select
					value={formData.projectSlug || undefined}
					onValueChange={(v) => {
						const proj = projects.find((p) => p.slug === v);
						setFormData({ projectSlug: v, projectName: proj?.title ?? "" });
					}}
					disabled={clientProjects.length === 0}
				>
					<SelectTrigger className={cn("w-full", triggerClass)}>
						<SelectValue
							placeholder={
								formData.clientSlug
									? clientProjects.length === 0
										? "Keine Projekte für diesen Kunden"
										: "Projekt auswählen…"
									: "Zuerst Kunde wählen"
							}
						/>
					</SelectTrigger>
					<SelectContent position="popper" className="z-[100] max-h-60">
						{clientProjects.map((p) => (
							<SelectItem key={p.slug} value={p.slug}>
								{p.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<ClientQuickDetailDrawer
				open={clientDrawerOpen}
				onOpenChange={setClientDrawerOpen}
				client={clientTarget}
				onSave={handleClientSave}
				closeAfterSuccessfulExplicitSave
			/>
			<ProjectDetailView
				open={projectDrawerOpen}
				onOpenChange={setProjectDrawerOpen}
				project={projectTarget}
				clients={clients}
				onSave={handleProjectSave}
			/>

			{showDescription ? (
				<div className="space-y-2">
					<Label>Beschreibung</Label>
					<Textarea
						placeholder="Was hast du gemacht?"
						value={formData.description}
						onChange={(e) => setFormData({ description: e.target.value })}
						className="resize-none"
						rows={compact ? 2 : 3}
					/>
				</div>
			) : null}

			<div className={fieldGap}>
				<Label className={labelClass}>Stundensatz (€)</Label>
				<Input
					type="number"
					min={0}
					step={5}
					value={formData.hourlyRate}
					onChange={(e) => setFormData({ hourlyRate: Number(e.target.value) })}
					className={dense ? "h-8 text-xs" : undefined}
				/>
				{selectedClient &&
					formData.hourlyRate !== selectedClient.hourlyRate && (
						<p className="text-xs text-muted-foreground">
							Standard: {selectedClient.hourlyRate} €
						</p>
					)}
			</div>

			<div className={cn("flex gap-2", dense ? "pt-1" : "pt-2")}>
				<Button
					size={dense ? "sm" : "default"}
					onClick={onSave}
					disabled={!hasData || isSaving || !vaultWriteEnabled}
					className={cn("flex-1 gap-2", dense && "text-xs h-8")}
				>
					<Save className={dense ? "size-3.5" : "size-4"} />
					{isSaving ? "Speichern…" : dense ? "Speichern" : "Session speichern"}
				</Button>
				<Button
					variant="outline"
					size={dense ? "sm" : "default"}
					onClick={onReset}
					disabled={!hasData}
					className={cn("gap-2", dense && "h-8 px-2")}
					aria-label="Session zurücksetzen"
				>
					<RotateCcw className={dense ? "size-3.5" : "size-4"} />
				</Button>
			</div>
		</div>
	);
}
