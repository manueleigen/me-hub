"use client";

import {
	useState,
	useTransition,
	useOptimistic,
	useEffect,
	useMemo,
} from "react";
import {
	Clock,
	Plus,
	CheckCircle2,
	ChevronUp,
	ChevronDown,
	ChevronsUpDown,
	MoreVertical,
	Pencil,
	Trash2,
	Copy,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntryDialog } from "./entry-dialog";
import {
	saveTimeEntry,
	markEntriesAsPaid,
	deleteVaultTimeEntry,
	listPaidEntries,
} from "@/app/actions/zeiterfassung";
import type {
	VaultTimeEntry,
	VaultTimeEntryFrontmatter,
	ProjectOpenSummary,
} from "@/types/zeiterfassung";
import type { Project } from "@/types/projects";
import type { Client } from "@/types/clients";
import { cn } from "@/lib/utils";

interface ZeiterfassungViewProps {
	openEntries: VaultTimeEntry[];
	projects: Project[];
	clients: Client[];
}

type SortKey =
	| "date"
	| "projectName"
	| "clientName"
	| "description"
	| "hours"
	| "amount";
type SortDir = "asc" | "desc";

type EntryAction =
	| { type: "add"; payload: VaultTimeEntry }
	| { type: "update"; payload: VaultTimeEntry }
	| { type: "delete"; slug: string }
	| { type: "deleteMany"; slugs: string[] };

function entryReducer(
	state: VaultTimeEntry[],
	action: EntryAction,
): VaultTimeEntry[] {
	switch (action.type) {
		case "add":
			return [action.payload, ...state];
		case "update":
			return state.map((e) =>
				e.slug === action.payload.slug ? action.payload : e,
			);
		case "delete":
			return state.filter((e) => e.slug !== action.slug);
		case "deleteMany":
			return state.filter((e) => !action.slugs.includes(e.slug));
	}
}

function daysBetween(dateStr: string): number {
	return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("de-DE", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function sortEntries(
	entries: VaultTimeEntry[],
	key: SortKey,
	dir: SortDir,
): VaultTimeEntry[] {
	return [...entries].sort((a, b) => {
		let cmp = 0;
		switch (key) {
			case "date":
				cmp = a.date.localeCompare(b.date);
				break;
			case "projectName":
				cmp = a.projectName.localeCompare(b.projectName);
				break;
			case "clientName":
				cmp = (a.clientName ?? "").localeCompare(b.clientName ?? "");
				break;
			case "description":
				cmp = (a.description ?? "").localeCompare(b.description ?? "");
				break;
			case "hours":
				cmp = a.hours - b.hours;
				break;
			case "amount":
				cmp =
					(a.billable ? a.hours * a.rate : 0) -
					(b.billable ? b.hours * b.rate : 0);
				break;
		}
		return dir === "asc" ? cmp : -cmp;
	});
}

function SortTh({
	label,
	colKey,
	currentKey,
	currentDir,
	onSort,
	className,
}: {
	label: string;
	colKey: SortKey;
	currentKey: SortKey;
	currentDir: SortDir;
	onSort: (k: SortKey) => void;
	className?: string;
}) {
	const active = colKey === currentKey;
	return (
		<th
			className={cn(
				"px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground",
				className,
			)}
			onClick={() => onSort(colKey)}
		>
			<span className="inline-flex items-center gap-1">
				{label}
				{active ? (
					currentDir === "asc" ? (
						<ChevronUp className="size-3" />
					) : (
						<ChevronDown className="size-3" />
					)
				) : (
					<ChevronsUpDown className="size-3 opacity-30" />
				)}
			</span>
		</th>
	);
}

function EntriesTable({
	entries,
	selected,
	onToggle,
	onToggleAll,
	onEdit,
	onDelete,
	onDuplicate,
	sortKey,
	sortDir,
	onSort,
	showSelect = true,
}: {
	entries: VaultTimeEntry[];
	selected: Set<string>;
	onToggle: (slug: string) => void;
	onToggleAll: (slugs: string[], checked: boolean) => void;
	onEdit: (entry: VaultTimeEntry) => void;
	onDelete: (entry: VaultTimeEntry) => void;
	onDuplicate: (entry: VaultTimeEntry) => void;
	sortKey: SortKey;
	sortDir: SortDir;
	onSort: (k: SortKey) => void;
	showSelect?: boolean;
}) {
	if (entries.length === 0) return null;

	const slugs = entries.map((e) => e.slug);
	const allSelected = slugs.every((s) => selected.has(s));

	return (
		<Card>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b">
							{showSelect && (
								<th className="px-3 py-2 w-8">
									<Checkbox
										checked={allSelected && slugs.length > 0}
										onCheckedChange={(v) => onToggleAll(slugs, !!v)}
										aria-label="Alle auswählen"
									/>
								</th>
							)}
							<SortTh
								label="Datum"
								colKey="date"
								currentKey={sortKey}
								currentDir={sortDir}
								onSort={onSort}
							/>
							<SortTh
								label="Projekt"
								colKey="projectName"
								currentKey={sortKey}
								currentDir={sortDir}
								onSort={onSort}
							/>
							<SortTh
								label="Klient"
								colKey="clientName"
								currentKey={sortKey}
								currentDir={sortDir}
								onSort={onSort}
							/>
							<SortTh
								label="Beschreibung"
								colKey="description"
								currentKey={sortKey}
								currentDir={sortDir}
								onSort={onSort}
								className="w-full"
							/>
							<SortTh
								label="Stunden"
								colKey="hours"
								currentKey={sortKey}
								currentDir={sortDir}
								onSort={onSort}
							/>
							<SortTh
								label="Betrag"
								colKey="amount"
								currentKey={sortKey}
								currentDir={sortDir}
								onSort={onSort}
							/>
							<th className="px-3 py-2 w-8" />
						</tr>
					</thead>
					<tbody className="divide-y">
						{entries.map((entry) => {
							const amount = entry.billable ? entry.hours * entry.rate : 0;
							const age = daysBetween(entry.date);
							return (
								<tr
									key={entry.slug}
									className={cn(
										"hover:bg-muted/40 transition-colors",
										selected.has(entry.slug) && "bg-muted/30",
									)}
								>
									{showSelect && (
										<td className="px-3 py-2">
											<Checkbox
												checked={selected.has(entry.slug)}
												onCheckedChange={() => onToggle(entry.slug)}
											/>
										</td>
									)}
									<td className="px-3 py-2 whitespace-nowrap">
										<span
											className={cn(age > 30 && "text-amber-600 font-medium")}
										>
											{formatDate(entry.date)}
										</span>
									</td>
									<td className="px-3 py-2 whitespace-nowrap font-medium">
										{entry.projectName}
									</td>
									<td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
										{entry.clientName || "–"}
									</td>
									<td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">
										{entry.description || "–"}
									</td>
									<td className="px-3 py-2 whitespace-nowrap font-semibold text-right">
										{entry.hours}h
									</td>
									<td className="px-3 py-2 whitespace-nowrap text-right text-muted-foreground">
										{amount > 0 ? `${amount.toFixed(0)} €` : "–"}
									</td>
									<td className="px-3 py-2">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="size-7">
													<MoreVertical className="size-3.5" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => onEdit(entry)}>
													<Pencil className="mr-2 size-4" />
													Bearbeiten
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => onDuplicate(entry)}>
													<Copy className="mr-2 size-4" />
													Duplizieren
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="text-destructive"
													onClick={() => onDelete(entry)}
												>
													<Trash2 className="mr-2 size-4" />
													Löschen
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

export function ZeiterfassungView({
	openEntries: initialOpenEntries,
	projects,
	clients,
}: ZeiterfassungViewProps) {
	const [isPending, startTransition] = useTransition();
	const [realEntries, setRealEntries] = useState(initialOpenEntries);
	const [optimisticEntries, dispatch] = useOptimistic(
		realEntries,
		entryReducer,
	);
	const [tab, setTab] = useState<"open" | "paid">("open");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [paidEntries, setPaidEntries] = useState<VaultTimeEntry[] | null>(null);
	const [paidLoading, setPaidLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<VaultTimeEntry | undefined>();
	const [sortKey, setSortKey] = useState<SortKey>("date");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	useEffect(() => {
		startTransition(() => setRealEntries(initialOpenEntries));
	}, [initialOpenEntries]);

	const projectSummaries = useMemo<ProjectOpenSummary[]>(() => {
		const map = new Map<string, ProjectOpenSummary>();
		for (const entry of optimisticEntries) {
			const existing = map.get(entry.projectSlug);
			if (!existing) {
				map.set(entry.projectSlug, {
					projectSlug: entry.projectSlug,
					projectName: entry.projectName,
					clientName: entry.clientName,
					totalHours: entry.hours,
					totalRevenue: entry.billable ? entry.hours * entry.rate : 0,
					entryCount: 1,
					oldestDate: entry.date,
					entries: [entry],
				});
			} else {
				existing.totalHours += entry.hours;
				existing.totalRevenue += entry.billable ? entry.hours * entry.rate : 0;
				existing.entryCount += 1;
				existing.entries.push(entry);
				if (entry.date < existing.oldestDate) existing.oldestDate = entry.date;
			}
		}
		return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
	}, [optimisticEntries]);

	const totalOpenHours = optimisticEntries.reduce((s, e) => s + e.hours, 0);
	const billableHours = optimisticEntries
		.filter((e) => e.billable)
		.reduce((s, e) => s + e.hours, 0);
	const totalRevenue = optimisticEntries.reduce(
		(s, e) => s + (e.billable ? e.hours * e.rate : 0),
		0,
	);
	const maxProjectHours = projectSummaries[0]?.totalHours ?? 1;

	const sortedOpenEntries = useMemo(
		() => sortEntries(optimisticEntries, sortKey, sortDir),
		[optimisticEntries, sortKey, sortDir],
	);
	const sortedPaidEntries = useMemo(
		() => (paidEntries ? sortEntries(paidEntries, sortKey, sortDir) : []),
		[paidEntries, sortKey, sortDir],
	);

	const handleSort = (key: SortKey) => {
		if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortKey(key);
			setSortDir("desc");
		}
	};

	const handleToggle = (slug: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(slug) ? next.delete(slug) : next.add(slug);
			return next;
		});
	};

	const handleToggleAll = (slugs: string[], checked: boolean) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (checked) slugs.forEach((s) => next.add(s));
			else slugs.forEach((s) => next.delete(s));
			return next;
		});
	};

	const handleMarkPaid = () => {
		const toMark = optimisticEntries.filter((e) => selected.has(e.slug));
		if (toMark.length === 0) return;
		const slugs = toMark.map((e) => e.slug);
		setSelected(new Set());
		startTransition(async () => {
			dispatch({ type: "deleteMany", slugs });
			try {
				await markEntriesAsPaid(toMark);
				startTransition(() => {
					setRealEntries((prev) => prev.filter((e) => !slugs.includes(e.slug)));
				});
			} catch {
				toast.error("Fehler beim Markieren als bezahlt");
			}
		});
	};

	const handleTabChange = async (value: string) => {
		setTab(value as "open" | "paid");
		if (value === "paid" && paidEntries === null) {
			setPaidLoading(true);
			try {
				const entries = await listPaidEntries();
				setPaidEntries(entries);
			} finally {
				setPaidLoading(false);
			}
		}
	};

	const handleSave = async (
		slug: string,
		data: VaultTimeEntryFrontmatter,
		sha?: string,
	) => {
		const optimisticEntry: VaultTimeEntry = {
			slug,
			sha,
			status: "open",
			projectSlug: data.projectSlug,
			projectName: data.projectName,
			clientSlug: data.clientSlug,
			clientName: data.clientName,
			date: data.date,
			hours: data.hours,
			description: data.description,
			rate: data.rate,
			billable: data.billable,
		};
		startTransition(async () => {
			dispatch(
				sha
					? { type: "update", payload: optimisticEntry }
					: { type: "add", payload: optimisticEntry },
			);
			try {
				await saveTimeEntry(slug, data, sha);
				startTransition(() => {
					setRealEntries((prev) =>
						sha
							? prev.map((e) => (e.slug === slug ? optimisticEntry : e))
							: [optimisticEntry, ...prev],
					);
				});
			} catch {
				toast.error("Fehler beim Speichern");
			}
		});
	};

	const handleDelete = (entry: VaultTimeEntry) => {
		if (!entry.sha) return;
		if (!confirm("Eintrag wirklich löschen?")) return;
		startTransition(async () => {
			dispatch({ type: "delete", slug: entry.slug });
			try {
				await deleteVaultTimeEntry(entry.slug, entry.status, entry.sha!);
				startTransition(() => {
					setRealEntries((prev) => prev.filter((e) => e.slug !== entry.slug));
				});
			} catch {
				toast.error("Fehler beim Löschen");
			}
		});
	};

	const handleDuplicate = (entry: VaultTimeEntry) => {
		const rand = Math.random().toString(36).slice(2, 8);
		const newSlug = `${entry.date}-${entry.projectSlug}-${rand}`;
		const optimisticEntry: VaultTimeEntry = {
			slug: newSlug,
			sha: undefined,
			status: "open",
			projectSlug: entry.projectSlug,
			projectName: entry.projectName,
			clientSlug: entry.clientSlug,
			clientName: entry.clientName,
			date: entry.date,
			hours: entry.hours,
			description: entry.description,
			rate: entry.rate,
			billable: entry.billable,
		};
		const data: VaultTimeEntryFrontmatter = {
			projectSlug: entry.projectSlug,
			projectName: entry.projectName,
			clientSlug: entry.clientSlug,
			clientName: entry.clientName,
			date: entry.date,
			hours: entry.hours,
			description: entry.description,
			rate: entry.rate,
			billable: entry.billable,
		};
		startTransition(async () => {
			dispatch({ type: "add", payload: optimisticEntry });
			try {
				await saveTimeEntry(newSlug, data);
				startTransition(() => {
					setRealEntries((prev) => [optimisticEntry, ...prev]);
				});
			} catch {
				toast.error("Fehler beim Duplizieren");
			}
		});
	};

	const openEdit = (entry: VaultTimeEntry) => {
		setEditTarget(entry);
		setDialogOpen(true);
	};

	const openCreate = () => {
		setEditTarget(undefined);
		setDialogOpen(true);
	};

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Zeiterfassung" }]} />

			<div className="flex-1 overflow-auto p-6">
				<div className="flex items-start justify-between gap-4 mb-6">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Zeiterfassung</h1>
						<p className="text-muted-foreground">
							Verwalte deine offenen und bezahlten Stunden.
						</p>
					</div>
					<Button onClick={openCreate} disabled={isPending}>
						<Plus className="size-4 mr-2" />
						Zeit erfassen
					</Button>
				</div>

				<Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
					<div className="flex items-center justify-between gap-4">
						<TabsList>
							<TabsTrigger value="open">
								Offen
								{optimisticEntries.length > 0 && (
									<Badge variant="secondary" className="ml-1.5">
										{optimisticEntries.length}
									</Badge>
								)}
							</TabsTrigger>
							<TabsTrigger value="paid">Bezahlt</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="open" className="space-y-6">
						{optimisticEntries.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 text-center">
								<Clock className="size-12 text-muted-foreground mb-4" />
								<h3 className="font-semibold text-lg">
									Keine offenen Einträge
								</h3>
								<p className="text-muted-foreground text-sm mt-1">
									Alle Stunden sind bezahlt – oder erfasse neue Zeit.
								</p>
								<Button className="mt-4" onClick={openCreate}>
									<Plus className="size-4 mr-2" />
									Zeit erfassen
								</Button>
							</div>
						) : (
							<>
								{/* Stats cards */}
								<div className="grid gap-4 md:grid-cols-4">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium text-muted-foreground">
												Offene Stunden
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{totalOpenHours.toFixed(1)}h
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												{optimisticEntries.length}{" "}
												{optimisticEntries.length === 1
													? "Eintrag"
													: "Einträge"}
											</p>
										</CardContent>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium text-muted-foreground">
												Abrechenbar
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{billableHours.toFixed(1)}h
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												{totalOpenHours > 0
													? ((billableHours / totalOpenHours) * 100).toFixed(0)
													: 0}
												% der Gesamtzeit
											</p>
										</CardContent>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium text-muted-foreground">
												Ausstehend
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{totalRevenue.toFixed(0)} €
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												{billableHours > 0
													? `⌀ ${(totalRevenue / billableHours).toFixed(0)} €/h`
													: "Nicht abrechenbar"}
											</p>
										</CardContent>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium text-muted-foreground">
												Projekte
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{projectSummaries.length}
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												Mit offenen Stunden
											</p>
										</CardContent>
									</Card>
								</div>

								{/* Project breakdown */}
								<Card>
									<CardHeader>
										<CardTitle className="text-base">Projekte</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{projectSummaries.map((summary) => {
											const pct = (summary.totalHours / maxProjectHours) * 100;
											const age = daysBetween(summary.oldestDate);
											return (
												<div key={summary.projectSlug} className="space-y-1.5">
													<div className="flex items-center justify-between gap-2">
														<div className="flex items-center gap-2 min-w-0">
															<span className="font-medium truncate">
																{summary.projectName}
															</span>
															{summary.clientName && (
																<span className="text-sm text-muted-foreground truncate">
																	· {summary.clientName}
																</span>
															)}
															{age > 30 && (
																<Badge
																	variant="outline"
																	className="text-amber-600 border-amber-300 shrink-0 text-xs"
																>
																	{age}d
																</Badge>
															)}
														</div>
														<div className="flex items-center gap-3 shrink-0 text-sm">
															<span className="font-semibold">
																{summary.totalHours.toFixed(1)}h
															</span>
															{summary.totalRevenue > 0 && (
																<span className="text-muted-foreground">
																	{summary.totalRevenue.toFixed(0)} €
																</span>
															)}
														</div>
													</div>
													<Progress value={pct} className="h-1.5" />
												</div>
											);
										})}
									</CardContent>
								</Card>

								{/* Sortable table */}
								<EntriesTable
									entries={sortedOpenEntries}
									selected={selected}
									onToggle={handleToggle}
									onToggleAll={handleToggleAll}
									onEdit={openEdit}
									onDelete={handleDelete}
									onDuplicate={handleDuplicate}
									sortKey={sortKey}
									sortDir={sortDir}
									onSort={handleSort}
									showSelect
								/>
							</>
						)}
					</TabsContent>

					<TabsContent value="paid" className="space-y-4">
						{paidLoading ? (
							<div className="text-center py-12 text-muted-foreground">
								Lade…
							</div>
						) : paidEntries === null ? null : paidEntries.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 text-center">
								<CheckCircle2 className="size-12 text-muted-foreground mb-4" />
								<p className="text-muted-foreground">
									Noch keine bezahlten Einträge.
								</p>
							</div>
						) : (
							<EntriesTable
								entries={sortedPaidEntries}
								selected={new Set()}
								onToggle={() => {}}
								onToggleAll={() => {}}
								onEdit={openEdit}
								onDelete={handleDelete}
								onDuplicate={handleDuplicate}
								sortKey={sortKey}
								sortDir={sortDir}
								onSort={handleSort}
								showSelect={false}
							/>
						)}
					</TabsContent>
				</Tabs>
			</div>

			{selected.size > 0 && tab === "open" && (
				<div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between gap-4">
					<span className="text-sm text-muted-foreground">
						{selected.size} {selected.size === 1 ? "Eintrag" : "Einträge"}{" "}
						ausgewählt
					</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSelected(new Set())}
						>
							Auswahl aufheben
						</Button>
						<Button size="sm" onClick={handleMarkPaid} disabled={isPending}>
							<CheckCircle2 className="size-4 mr-2" />
							Als bezahlt markieren
						</Button>
					</div>
				</div>
			)}

			<EntryDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				projects={projects}
				clients={clients}
				entry={editTarget}
				onSave={handleSave}
			/>
		</>
	);
}
