"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import type { CatalogFilterTab, CatalogListLabels } from "@/lib/entity/types";

export type CatalogListPageProps<T> = {
	labels: CatalogListLabels;
	items: T[];
	isRefreshing?: boolean;
	filterTabs: CatalogFilterTab[];
	filterValue: string;
	onFilterChange: (value: string) => void;
	matchFilter: (item: T, filter: string) => boolean;
	matchSearch: (item: T, query: string) => boolean;
	onCreate: () => void;
	renderCard: (item: T) => ReactNode;
	detailOpen: boolean;
	onDetailOpenChange: (open: boolean) => void;
	renderEditDrawer: (props: {
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}) => ReactNode;
};

export function CatalogListPage<T>({
	labels,
	items,
	isRefreshing = false,
	filterTabs,
	filterValue,
	onFilterChange,
	matchFilter,
	matchSearch,
	onCreate,
	renderCard,
	detailOpen,
	onDetailOpenChange,
	renderEditDrawer,
}: CatalogListPageProps<T>) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const [search, setSearch] = useState("");
	const EmptyIcon = labels.emptyIcon;

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return items.filter(
			(item) => matchFilter(item, filterValue) && matchSearch(item, q),
		);
	}, [items, search, filterValue, matchFilter, matchSearch]);

	const isFiltered = Boolean(search) || filterValue !== filterTabs[0]?.value;

	return (
		<>
			<AppHeader breadcrumbs={[{ label: labels.breadcrumb }]} />
			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">{labels.title}</h1>
						<p className="text-sm text-muted-foreground">
							{labels.countLabel(items.length)}
							{isRefreshing && (
								<span className="ml-2 text-xs opacity-70">Aktualisiere…</span>
							)}
						</p>
					</div>
					<Button onClick={onCreate} disabled={!vaultWriteEnabled}>
						<Plus className="size-4 mr-2" />
						{labels.createButton}
					</Button>
				</div>

				<div className="flex flex-col sm:flex-row gap-3">
					<Input
						placeholder={labels.searchPlaceholder}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="max-w-xs"
					/>
					{filterTabs.length > 1 && (
						<Tabs value={filterValue} onValueChange={onFilterChange}>
							<TabsList>
								{filterTabs.map((tab) => (
									<TabsTrigger key={tab.value} value={tab.value}>
										{tab.label}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
					)}
				</div>

				{filtered.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<EmptyIcon className="size-12 text-muted-foreground mb-4" />
						<h3 className="font-semibold text-lg">{labels.emptyTitle}</h3>
						<p className="text-muted-foreground text-sm mt-1">
							{isFiltered
								? labels.emptyDescriptionFiltered
								: labels.emptyDescription}
						</p>
						{!isFiltered && (
							<Button
								className="mt-4"
								onClick={onCreate}
								disabled={!vaultWriteEnabled}
							>
								<Plus className="size-4 mr-2" />
								{labels.emptyCreateButton}
							</Button>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{filtered.map((item) => renderCard(item))}
					</div>
				)}
			</div>

			{renderEditDrawer({ open: detailOpen, onOpenChange: onDetailOpenChange })}
		</>
	);
}
