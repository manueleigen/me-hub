"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DetailDrawer } from "@/components/detail-drawer/detail-drawer";
import { DetailDrawerFooter } from "@/components/detail-drawer/detail-drawer-footer";
import { useDetailDrawer } from "@/hooks/use-detail-drawer";
import { DRAFT_RECORD_SLUG, isDraftSlug } from "@/lib/detail-drawer/constants";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import type { VaultTimeEntry, VaultTimeEntryFrontmatter } from "@/types/zeiterfassung";
import type { Project } from "@/types/projects";
import type { Client } from "@/types/clients";

export type EntryFormSnapshot = {
	date: string;
	projectSlug: string;
	projectName: string;
	clientSlug: string;
	clientName: string;
	hours: number;
	description: string;
	rate: number;
	billable: boolean;
};

function makeEntrySlug(date: string, projectSlug: string): string {
	const rand = Math.random().toString(36).slice(2, 8);
	return `${date}-${projectSlug}-${rand}`;
}

function snapshotFromEntry(entry: VaultTimeEntry): EntryFormSnapshot {
	return {
		date: entry.date,
		projectSlug: entry.projectSlug,
		projectName: entry.projectName,
		clientSlug: entry.clientSlug ?? "",
		clientName: entry.clientName ?? "",
		hours: entry.hours,
		description: entry.description ?? "",
		rate: entry.rate ?? 0,
		billable: entry.billable ?? false,
	};
}

function snapshotsEqual(a: EntryFormSnapshot, b: EntryFormSnapshot): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function createDraftTimeEntry(today: string): VaultTimeEntry {
	return {
		slug: DRAFT_RECORD_SLUG,
		date: today,
		projectSlug: "",
		projectName: "",
		hours: 1,
		description: "",
		rate: 0,
		billable: false,
		status: "open",
		folder: "time-tracking/open",
	};
}

type EntryDetailViewProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projects: Project[];
	clients: Client[];
	entry?: VaultTimeEntry;
	onSave: (slug: string, data: VaultTimeEntryFrontmatter, sha?: string) => Promise<void>;
};

export function EntryDetailView({
	open,
	onOpenChange,
	projects,
	clients,
	entry,
	onSave,
}: EntryDetailViewProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const entryRef = useRef(entry);
	const isCreate = entry ? isDraftSlug(entry.slug) : false;
	const today = new Date().toISOString().split("T")[0];

	const [date, setDate] = useState(today);
	const [projectSlug, setProjectSlug] = useState("");
	const [projectName, setProjectName] = useState("");
	const [clientSlug, setClientSlug] = useState("");
	const [clientName, setClientName] = useState("");
	const [hours, setHours] = useState(1);
	const [description, setDescription] = useState("");
	const [rate, setRate] = useState(0);
	const [billable, setBillable] = useState(false);

	useEffect(() => {
		entryRef.current = entry;
	}, [entry]);

	const resetForm = useCallback(() => {
		if (!entry) return;
		const snap = snapshotFromEntry(entry);
		setDate(snap.date);
		setProjectSlug(snap.projectSlug);
		setProjectName(snap.projectName);
		setClientSlug(snap.clientSlug);
		setClientName(snap.clientName);
		setHours(snap.hours);
		setDescription(snap.description);
		setRate(snap.rate);
		setBillable(snap.billable);
	}, [entry]);

	useEffect(() => {
		if (!open || !entry) return;
		resetForm();
	}, [open, entry?.slug, resetForm]);

	const handleProjectChange = (slug: string) => {
		const project = projects.find((p) => p.slug === slug);
		if (!project) return;
		setProjectSlug(project.slug);
		setProjectName(project.title);

		const linkedClient = clients.find((c) => c.slug === project.client);
		if (linkedClient) {
			setClientSlug(linkedClient.slug);
			setClientName(linkedClient.name);
			const r = linkedClient.hourlyRate ?? 0;
			setRate(r);
			setBillable(r > 0);
		} else {
			setClientSlug("");
			setClientName(project.clientName ?? "");
			setRate(0);
			setBillable(false);
		}
	};

	const getSnapshot = useCallback(
		(): EntryFormSnapshot => ({
			date,
			projectSlug,
			projectName,
			clientSlug,
			clientName,
			hours,
			description,
			rate,
			billable,
		}),
		[
			date,
			projectSlug,
			projectName,
			clientSlug,
			clientName,
			hours,
			description,
			rate,
			billable,
		],
	);

	const buildInitialSnapshot = useCallback(
		(): EntryFormSnapshot => (entry ? snapshotFromEntry(entry) : getSnapshot()),
		[entry, getSnapshot],
	);

	const persistSnapshot = useCallback(
		async (snapshot: EntryFormSnapshot) => {
			const active = entryRef.current;
			if (!active) return;

			const slug = isDraftSlug(active.slug)
				? makeEntrySlug(snapshot.date, snapshot.projectSlug)
				: active.slug;

			const data: VaultTimeEntryFrontmatter = {
				projectSlug: snapshot.projectSlug,
				projectName: snapshot.projectName,
				clientSlug: snapshot.clientSlug || undefined,
				clientName: snapshot.clientName || undefined,
				date: snapshot.date,
				hours: snapshot.hours,
				description: snapshot.description,
				rate: snapshot.rate,
				billable: snapshot.billable,
			};

			await onSave(
				slug,
				data,
				isDraftSlug(active.slug) ? undefined : active.sha,
			);
		},
		[onSave],
	);

	const drawer = useDetailDrawer({
		open,
		onOpenChange,
		resetDep: entry?.slug,
		getSnapshot,
		buildInitialSnapshot,
		isDirtyCompare: (a, b) => !snapshotsEqual(a, b),
		validate: () => {
			if (!projectSlug) return "Bitte ein Projekt wählen";
			if (!date) return "Datum fehlt";
			if (hours <= 0) return "Stunden müssen größer als 0 sein";
			return null;
		},
		onSave: persistSnapshot,
		saveEnabled: vaultWriteEnabled,
	});

	if (!entry) return null;

	return (
		<DetailDrawer
			open={open}
			onOpenChange={drawer.handleOpenChange}
			srTitle={isCreate ? "Zeit erfassen" : "Eintrag bearbeiten"}
			onClose={drawer.closeAndSaveInBackground}
			className="sm:max-w-md"
			header={
				<h2 className="text-lg font-semibold">
					{isCreate ? "Manueller Eintrag" : "Eintrag bearbeiten"}
				</h2>
			}
			footer={
				<DetailDrawerFooter
					onClose={drawer.closeAndSaveInBackground}
					onSave={drawer.persistAndStay}
					saving={drawer.saving}
					isDirty={drawer.isDirty()}
					writeEnabled={vaultWriteEnabled}
				/>
			}
		>
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="entry-detail-date">Datum</Label>
						<Input
							id="entry-detail-date"
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="entry-detail-hours">Stunden</Label>
						<Input
							id="entry-detail-hours"
							type="number"
							step="0.5"
							min="0.5"
							max="24"
							value={hours}
							onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label>Projekt</Label>
					<Select
						value={projectSlug}
						onValueChange={handleProjectChange}
						disabled={!vaultWriteEnabled}
					>
						<SelectTrigger>
							<SelectValue placeholder="Projekt wählen…" />
						</SelectTrigger>
						<SelectContent>
							{projects.map((p) => (
								<SelectItem key={p.slug} value={p.slug}>
									<span>{p.title}</span>
									{p.clientName ? (
										<span className="text-muted-foreground ml-1.5">
											· {p.clientName}
										</span>
									) : null}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{clientName ? (
					<p className="text-sm text-muted-foreground">Klient: {clientName}</p>
				) : null}

				<div className="space-y-1.5">
					<Label htmlFor="entry-detail-desc">Beschreibung</Label>
					<Input
						id="entry-detail-desc"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						disabled={!vaultWriteEnabled}
						placeholder="Was wurde gemacht?"
					/>
				</div>

				<div className="flex items-center justify-between rounded-lg border p-3">
					<div className="space-y-0.5">
						<Label htmlFor="entry-detail-billable" className="cursor-pointer">
							Abrechenbar
						</Label>
						<p className="text-xs text-muted-foreground">
							{billable
								? `${rate} EUR/h · ${(hours * rate).toFixed(0)} EUR`
								: "Nicht abrechenbar"}
						</p>
					</div>
					<Switch
						id="entry-detail-billable"
						checked={billable}
						onCheckedChange={setBillable}
						disabled={!vaultWriteEnabled}
					/>
				</div>

				{billable ? (
					<div className="space-y-1.5">
						<Label htmlFor="entry-detail-rate">Stundensatz (EUR)</Label>
						<Input
							id="entry-detail-rate"
							type="number"
							min="0"
							step="5"
							value={rate}
							onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
				) : null}
			</div>
		</DetailDrawer>
	);
}
