"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Building2, Clock, Euro, TrendingUp } from "lucide-react";
import { ClientList } from "@/components/kunden/client-list";
import { getClientsWithStats } from "@/lib/mock-data/kunden";
import type { ClientStatus } from "@/types/kunden";

type FilterStatus = ClientStatus | "all";

export default function KundenPage() {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<FilterStatus>("all");

	const allClients = getClientsWithStats();

	// Filter clients
	const filteredClients = allClients.filter((client) => {
		const matchesSearch =
			client.name.toLowerCase().includes(search.toLowerCase()) ||
			client.contact.toLowerCase().includes(search.toLowerCase());
		const matchesFilter = filter === "all" || client.status === filter;
		return matchesSearch && matchesFilter;
	});

	// Stats
	const totalClients = allClients.length;
	const activeClients = allClients.filter((c) => c.status === "active").length;
	const totalHours = allClients.reduce((sum, c) => sum + c.totalHours, 0);
	const totalRevenue = allClients.reduce((sum, c) => sum + c.totalRevenue, 0);

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Kunden" }]} />
			<div className="flex-1 overflow-auto p-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Kunden</h1>
						<p className="text-muted-foreground">
							Verwalte deine Kunden und deren Projekte.
						</p>
					</div>
					<Button>
						<Plus className="mr-2 size-4" />
						Neuer Kunde
					</Button>
				</div>

				{/* Stats */}
				<div className="grid gap-4 md:grid-cols-4 mb-6">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Building2 className="size-4" />
								Kunden
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{totalClients}</div>
							<p className="text-xs text-muted-foreground">
								{activeClients} aktiv
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Clock className="size-4" />
								Stunden gesamt
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{totalHours.toFixed(0)}h</div>
							<p className="text-xs text-muted-foreground">Alle Kunden</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Euro className="size-4" />
								Umsatz gesamt
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{(totalRevenue / 1000).toFixed(1)}k EUR
							</div>
							<p className="text-xs text-muted-foreground">Alle Kunden</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<TrendingUp className="size-4" />
								Durchschnitt
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{activeClients > 0
									? (totalRevenue / activeClients / 1000).toFixed(1)
									: 0}
								k EUR
							</div>
							<p className="text-xs text-muted-foreground">
								Pro aktivem Kunden
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Filters */}
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Kunden suchen..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>

					<Tabs
						value={filter}
						onValueChange={(v) => setFilter(v as FilterStatus)}
					>
						<TabsList>
							<TabsTrigger value="all">Alle</TabsTrigger>
							<TabsTrigger value="active">Aktiv</TabsTrigger>
							<TabsTrigger value="prospect">Interessenten</TabsTrigger>
							<TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{/* Client List */}
				<ClientList clients={filteredClients} />
			</div>
		</>
	);
}
