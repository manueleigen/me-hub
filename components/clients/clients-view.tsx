"use client";

import { useState } from "react";
import { isDraftSlug } from "@/lib/detail-drawer/constants";
import { CatalogListPage } from "@/components/entity/catalog-list-page";
import { useCatalogListState } from "@/components/entity/use-catalog-list-state";
import { ClientCard } from "@/components/clients/client-card";
import {
	ClientQuickDetailDrawer,
	createDraftClient,
} from "@/components/clients/client-quick-detail-drawer";
import { saveClient, deleteClient } from "@/app/actions/clients";
import {
	clientFilterTabs,
	clientListLabels,
	clientMatchesFilter,
} from "@/lib/entity/modules/clients";
import type { Client, ClientFrontmatter, ClientStatus } from "@/types/clients";

export function ClientsView({ clients: initialClients }: { clients: Client[] }) {
	const [filter, setFilter] = useState("all");

	const listState = useCatalogListState<Client>({
		initialItems: initialClients,
		getItemKey: (c) => c.slug,
		getItemSha: (c) => c.sha,
		shouldSyncDetailTarget: (current, next) =>
			!current || current.slug === next.slug || isDraftSlug(current.slug),
		upsertItems: (items, optimistic, isUpdate) =>
			isUpdate
				? items.map((c) => (c.slug === optimistic.slug ? optimistic : c))
				: [...items, optimistic],
		findPreviousItem: (items, key) => items.find((c) => c.slug === key),
		persistItem: async (optimistic, sha) => {
			const data: ClientFrontmatter = {
				name: optimistic.name,
				type: optimistic.type,
				contact: optimistic.contact,
				email: optimistic.email,
				phone: optimistic.phone,
				website: optimistic.website,
				address: optimistic.address,
				hourlyRate: optimistic.hourlyRate,
				status: optimistic.status,
				since: optimistic.since,
				notes: optimistic.notes,
			};
			await saveClient(optimistic.slug, data, sha);
		},
		deleteItem: (client) => deleteClient(client.slug, client.sha!),
		deleteConfirmMessage: clientListLabels.deleteConfirm,
	});

	const openCreate = () => {
		listState.setDetailTarget(createDraftClient());
		listState.setDetailOpen(true);
	};

	const openEdit = (client: Client) => {
		listState.setDetailTarget(client);
		listState.setDetailOpen(true);
	};

	const handleSave = async (
		slug: string,
		data: ClientFrontmatter,
		sha?: string,
	) => {
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
		await listState.persistWithOptimistic(optimistic, sha);
	};

	return (
		<CatalogListPage
			labels={clientListLabels}
			items={listState.items}
			isRefreshing={listState.isRefreshing}
			filterTabs={clientFilterTabs}
			filterValue={filter}
			onFilterChange={setFilter}
			matchFilter={(client, f) => clientMatchesFilter(client.status, f as ClientStatus | "all")}
			matchSearch={(client, q) => {
				if (!q) return true;
				const lower = q.toLowerCase();
				return (
					client.name.toLowerCase().includes(lower) ||
					(client.contact?.toLowerCase().includes(lower) ?? false) ||
					(client.email?.toLowerCase().includes(lower) ?? false) ||
					(client.type?.toLowerCase().includes(lower) ?? false)
				);
			}}
			onCreate={openCreate}
			renderCard={(client) => (
				<ClientCard
					key={client.slug}
					client={client}
					onEdit={() => openEdit(client)}
					onDelete={() => listState.handleDelete(client)}
				/>
			)}
			detailOpen={listState.detailOpen}
			onDetailOpenChange={listState.setDetailOpen}
			renderEditDrawer={({ open, onOpenChange }) => (
				<ClientQuickDetailDrawer
					open={open}
					onOpenChange={onOpenChange}
					client={listState.resolveDetailItem(listState.detailTarget)}
					onSave={handleSave}
					onDelete={(c) => {
						onOpenChange(false);
						listState.handleDelete(c);
					}}
				/>
			)}
		/>
	);
}
