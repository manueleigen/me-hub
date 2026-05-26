"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { DetailDrawer } from "@/components/detail-drawer/detail-drawer";
import { DetailDrawerTitle } from "@/components/detail-drawer/detail-drawer-title";
import { DetailDrawerFooter } from "@/components/detail-drawer/detail-drawer-footer";
import { useDetailDrawer } from "@/hooks/use-detail-drawer";
import { DRAFT_RECORD_SLUG, isDraftSlug } from "@/lib/detail-drawer/constants";
import { slugify } from "@/lib/frontmatter";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import type { Client, ClientFrontmatter, ClientStatus } from "@/types/clients";

export type ClientFormSnapshot = {
	name: string;
	type: string;
	contact: string;
	email: string;
	phone: string;
	website: string;
	address: string;
	hourlyRate: string;
	status: ClientStatus;
	since: string;
	notes: string;
};

export function snapshotFromClient(client: Client): ClientFormSnapshot {
	return {
		name: client.name,
		type: client.type ?? "",
		contact: client.contact ?? "",
		email: client.email ?? "",
		phone: client.phone ?? "",
		website: client.website ?? "",
		address: client.address ?? "",
		hourlyRate: client.hourlyRate != null ? String(client.hourlyRate) : "",
		status: client.status,
		since: client.since ?? "",
		notes: client.notes ?? "",
	};
}

function snapshotsEqual(a: ClientFormSnapshot, b: ClientFormSnapshot): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function createDraftClient(): Client {
	return {
		slug: DRAFT_RECORD_SLUG,
		name: "",
		status: "prospect",
	};
}

type ClientQuickDetailDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	client?: Client;
	onSave: (slug: string, data: ClientFrontmatter, sha?: string) => Promise<void>;
	/** Nach „Speichern“ Drawer schließen (z.B. Schnellerfassung in Zeiterfassung). */
	closeAfterSuccessfulExplicitSave?: boolean;
	onDelete?: (client: Client) => void;
};

/** Listen-Drawer: neu / bearbeiten (nicht zu verwechseln mit `/clients/[slug]` Page `client-detail-view`). */
export function ClientQuickDetailDrawer({
	open,
	onOpenChange,
	client,
	onSave,
	closeAfterSuccessfulExplicitSave,
	onDelete,
}: ClientQuickDetailDrawerProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const clientRef = useRef(client);
	const isCreate = client ? isDraftSlug(client.slug) : false;

	const [name, setName] = useState("");
	const [type, setType] = useState("");
	const [contact, setContact] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [website, setWebsite] = useState("");
	const [address, setAddress] = useState("");
	const [hourlyRate, setHourlyRate] = useState("");
	const [status, setStatus] = useState<ClientStatus>("prospect");
	const [since, setSince] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		clientRef.current = client;
	}, [client]);

	const resetForm = useCallback(() => {
		if (!client) return;
		const snap = snapshotFromClient(client);
		setName(snap.name);
		setType(snap.type);
		setContact(snap.contact);
		setEmail(snap.email);
		setPhone(snap.phone);
		setWebsite(snap.website);
		setAddress(snap.address);
		setHourlyRate(snap.hourlyRate);
		setStatus(snap.status);
		setSince(snap.since || new Date().toISOString().split("T")[0]);
		setNotes(snap.notes);
	}, [client]);

	useEffect(() => {
		if (!open || !client) return;
		resetForm();
	}, [open, client?.slug, resetForm]);

	const getSnapshot = useCallback(
		(): ClientFormSnapshot => ({
			name: name.trim(),
			type,
			contact,
			email,
			phone,
			website,
			address,
			hourlyRate,
			status,
			since,
			notes,
		}),
		[name, type, contact, email, phone, website, address, hourlyRate, status, since, notes],
	);

	const buildInitialSnapshot = useCallback(
		(): ClientFormSnapshot =>
			client ? snapshotFromClient(client) : getSnapshot(),
		[client, getSnapshot],
	);

	const persistSnapshot = useCallback(
		async (snapshot: ClientFormSnapshot) => {
			const active = clientRef.current;
			if (!active) return;

			const nextSlug =
				isDraftSlug(active.slug) ? slugify(snapshot.name) : active.slug;
			const data: ClientFrontmatter = {
				name: snapshot.name,
				type: snapshot.type.trim() || undefined,
				contact: snapshot.contact.trim() || undefined,
				email: snapshot.email.trim() || undefined,
				phone: snapshot.phone.trim() || undefined,
				website: snapshot.website.trim() || undefined,
				address: snapshot.address.trim() || undefined,
				hourlyRate: snapshot.hourlyRate ? Number(snapshot.hourlyRate) : undefined,
				status: snapshot.status,
				since: snapshot.since || new Date().toISOString().split("T")[0],
				notes: snapshot.notes.trim() || undefined,
			};

			await onSave(
				nextSlug,
				data,
				isDraftSlug(active.slug) ? undefined : active.sha,
			);
		},
		[onSave],
	);

	const drawer = useDetailDrawer({
		open,
		onOpenChange,
		resetDep: client?.slug,
		getSnapshot,
		buildInitialSnapshot,
		isDirtyCompare: (a, b) => !snapshotsEqual(a, b),
		validate: () => (!name.trim() ? "Name darf nicht leer sein" : null),
		onSave: persistSnapshot,
		saveEnabled: vaultWriteEnabled,
		afterSuccessfulPersistStay: closeAfterSuccessfulExplicitSave
			? () => onOpenChange(false)
			: undefined,
	});

	if (!client) return null;

	return (
		<DetailDrawer
			open={open}
			onOpenChange={drawer.handleOpenChange}
			srTitle={isCreate ? "Neuer Klient" : name.trim() || "Klient bearbeiten"}
			onClose={drawer.closeAndSaveInBackground}
			header={
				<DetailDrawerTitle
					id="client-drawer-name"
					value={name}
					onChange={setName}
					disabled={!vaultWriteEnabled}
					placeholder="Klientenname"
				/>
			}
			footer={
				<DetailDrawerFooter
					onClose={drawer.closeAndSaveInBackground}
					onSave={drawer.persistAndStay}
					onDelete={
						onDelete && !isCreate && client.sha ? () => onDelete(client) : undefined
					}
					saving={drawer.saving}
					isDirty={drawer.isDirty()}
					writeEnabled={vaultWriteEnabled}
				/>
			}
		>
			<div className="space-y-4">
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label>Typ</Label>
						<Select value={type} onValueChange={setType} disabled={!vaultWriteEnabled}>
							<SelectTrigger>
								<SelectValue placeholder="Typ wählen" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="company">Unternehmen</SelectItem>
								<SelectItem value="agency">Agentur</SelectItem>
								<SelectItem value="ngo">NGO</SelectItem>
								<SelectItem value="individual">Privatperson</SelectItem>
								<SelectItem value="startup">Startup</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label>Status</Label>
						<Select
							value={status}
							onValueChange={(v) => setStatus(v as ClientStatus)}
							disabled={!vaultWriteEnabled}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Aktiv</SelectItem>
								<SelectItem value="prospect">Interessent</SelectItem>
								<SelectItem value="inactive">Inaktiv</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="client-drawer-contact">Ansprechpartner</Label>
					<Input
						id="client-drawer-contact"
						value={contact}
						onChange={(e) => setContact(e.target.value)}
						disabled={!vaultWriteEnabled}
						placeholder="Max Mustermann"
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="client-drawer-email">E-Mail</Label>
						<Input
							id="client-drawer-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="client-drawer-phone">Telefon</Label>
						<Input
							id="client-drawer-phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="client-drawer-website">Website</Label>
						<Input
							id="client-drawer-website"
							value={website}
							onChange={(e) => setWebsite(e.target.value)}
							disabled={!vaultWriteEnabled}
							placeholder="https://example.com"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="client-drawer-rate">Stundensatz (€)</Label>
						<Input
							id="client-drawer-rate"
							type="number"
							min={0}
							value={hourlyRate}
							onChange={(e) => setHourlyRate(e.target.value)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="client-drawer-address">Adresse</Label>
						<Input
							id="client-drawer-address"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="client-drawer-since">Kunde seit</Label>
						<Input
							id="client-drawer-since"
							type="date"
							value={since}
							onChange={(e) => setSince(e.target.value)}
							disabled={!vaultWriteEnabled}
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="client-drawer-notes">Notizen</Label>
					<Textarea
						id="client-drawer-notes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						disabled={!vaultWriteEnabled}
						rows={3}
						placeholder="Interne Notizen…"
					/>
				</div>
			</div>
		</DetailDrawer>
	);
}
