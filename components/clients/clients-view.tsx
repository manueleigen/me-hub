"use client";

import { useState, useTransition, useOptimistic, useEffect } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientCard } from "./client-card";
import { ClientDialog } from "./client-dialog";
import { saveClient, deleteClient } from "@/app/actions/clients";
import type { Client, ClientFrontmatter, ClientStatus } from "@/types/clients";
import { AppHeader } from "../layout/app-header";

type FilterStatus = "all" | ClientStatus;

type ClientAction =
	| { type: "add"; payload: Client }
	| { type: "update"; payload: Client }
	| { type: "delete"; slug: string };

function clientReducer(state: Client[], action: ClientAction): Client[] {
	switch (action.type) {
		case "add":
			return [...state, action.payload];
		case "update":
			return state.map((c) =>
				c.slug === action.payload.slug ? action.payload : c,
			);
		case "delete":
			return state.filter((c) => c.slug !== action.slug);
	}
}

interface ClientsViewProps {
	clients: Client[];
}

export function ClientsView({ clients: initialClients }: ClientsViewProps) {
	const [isPending, startTransition] = useTransition();
	const [realClients, setRealClients] = useState(initialClients);
	const [optimisticClients, dispatch] = useOptimistic(
		realClients,
		clientReducer,
	);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<FilterStatus>("all");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<Client | undefined>();

	useEffect(() => {
		startTransition(() => setRealClients(initialClients));
	}, [initialClients]);

	const filtered = optimisticClients.filter((c) => {
		const matchesStatus = filter === "all" || c.status === filter;
		const q = search.toLowerCase();
		const matchesSearch =
			!q ||
			c.name.toLowerCase().includes(q) ||
			(c.contact?.toLowerCase().includes(q) ?? false) ||
			(c.email?.toLowerCase().includes(q) ?? false) ||
			(c.type?.toLowerCase().includes(q) ?? false);
		return matchesStatus && matchesSearch;
	});

	const openCreate = () => {
		setEditTarget(undefined);
		setDialogOpen(true);
	};

	const openEdit = (client: Client) => {
		setEditTarget(client);
		setDialogOpen(true);
	};

	const handleSave = async (
		slug: string,
		data: ClientFrontmatter,
		sha?: string,
	) => {
		const optimisticClient: Client = {
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
		startTransition(async () => {
			dispatch(
				sha
					? { type: "update", payload: optimisticClient }
					: { type: "add", payload: optimisticClient },
			);
			try {
				await saveClient(slug, data, sha);
				startTransition(() => {
					setRealClients((prev) =>
						sha
							? prev.map((c) => (c.slug === slug ? optimisticClient : c))
							: [...prev, optimisticClient],
					);
				});
			} catch {
				toast.error("Fehler beim Speichern");
			}
		});
	};

	const handleDelete = (client: Client) => {
		if (!client.sha) return;
		startTransition(async () => {
			dispatch({ type: "delete", slug: client.slug });
			try {
				await deleteClient(client.slug, client.sha!);
				startTransition(() => {
					setRealClients((prev) => prev.filter((c) => c.slug !== client.slug));
				});
			} catch {
				toast.error("Fehler beim Löschen");
			}
		});
	};

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Kunden" }]} />

			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Kunden</h1>
						<p className="text-sm text-muted-foreground">
							{optimisticClients.length}{" "}
							{optimisticClients.length === 1 ? "Klient" : "Klienten"}
						</p>
					</div>
					<Button onClick={openCreate} disabled={isPending}>
						<Plus className="size-4 mr-2" />
						Neuer Klient
					</Button>
				</div>

				<div className="flex flex-col sm:flex-row gap-3">
					<Input
						placeholder="Klienten durchsuchen…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="max-w-xs"
					/>
					<Tabs
						value={filter}
						onValueChange={(v) => setFilter(v as FilterStatus)}
					>
						<TabsList>
							<TabsTrigger value="all">Alle</TabsTrigger>
							<TabsTrigger value="active">Aktiv</TabsTrigger>
							<TabsTrigger value="prospect">Interessenten</TabsTrigger>
							<TabsTrigger value="inactive">Inaktiv</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{filtered.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<Users className="size-12 text-muted-foreground mb-4" />
						<h3 className="font-semibold text-lg">Keine Klienten</h3>
						<p className="text-muted-foreground text-sm mt-1">
							{search || filter !== "all"
								? "Keine Klienten gefunden. Filter anpassen?"
								: "Lege deinen ersten Klienten an."}
						</p>
						{!search && filter === "all" && (
							<Button className="mt-4" onClick={openCreate}>
								<Plus className="size-4 mr-2" />
								Ersten Klienten anlegen
							</Button>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{filtered.map((client) => (
							<ClientCard
								key={client.slug}
								client={client}
								onEdit={openEdit}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}

				<ClientDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					client={editTarget}
					onSave={handleSave}
				/>
			</div>
		</>
	);
}
