"use client";

import { useState, useTransition, useCallback, useEffect, useMemo } from "react";
import { Timer, CalendarClock, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeTrackerWidget } from "./time-tracker-widget";
import {
	SessionsListing,
	PAGE_SIZE_OPTIONS,
	type PageSizeOption,
} from "./sessions-listing";
import { TrackerStatistics } from "./tracker-statistics";
import { PlannedSessions } from "./planned-sessions";
import {
	EntryDetailView,
	createDraftTimeEntry,
} from "./entry-detail-view";
import { useSync } from "@/lib/vault/sync-context";

import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import {
	markEntriesAsPaid,
	deleteVaultTimeEntry,
	saveTrackerSession,
	saveTimeEntry,
	fetchTimeEntriesPage,
	fetchZeiterfassungStats,
} from "@/app/actions/zeiterfassung";
import {
	applyPlannedSessions,
	type ZeiterfassungStatsPayload,
} from "@/lib/zeiterfassung/stats";
import { OPEN_FOLDER, SESSIONS_FOLDER } from "@/lib/zeiterfassung/entry-utils";
import type { PlannedSession } from "@/types/zeiterfassung";

import type {
	VaultTimeEntry,
	VaultTimeEntryFrontmatter,
} from "@/types/zeiterfassung";
import type { Project } from "@/types/projects";
import type { Client } from "@/types/clients";

export interface ZeiterfassungViewProps {
	projects: Project[];
	clients: Client[];
}

function EntriesListingSkeleton() {
	return (
		<div className="space-y-3">
			<div className="flex gap-3">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-8 w-20 ml-auto" />
			</div>
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-10 w-full" />
			))}
		</div>
	);
}

export function ZeiterfassungView({
	projects: initialProjects,
	clients: initialClients,
}: ZeiterfassungViewProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const [isPending, startTransition] = useTransition();
	const [projects, setProjects] = useState(initialProjects);
	const [clients, setClients] = useState(initialClients);

	useEffect(() => {
		setProjects(initialProjects);
		setClients(initialClients);
	}, [initialProjects, initialClients]);

	const [entries, setEntries] = useState<VaultTimeEntry[]>([]);
	const [entriesLoading, setEntriesLoading] = useState(true);
	const [entriesPage, setEntriesPage] = useState(1);
	const [entriesPageSize, setEntriesPageSize] = useState<PageSizeOption>(10);
	const [entriesTab, setEntriesTab] = useState<"open" | "paid">("open");
	const [entriesTotal, setEntriesTotal] = useState(0);
	const [totalOpen, setTotalOpen] = useState(0);
	const [totalPaid, setTotalPaid] = useState(0);

	const [stats, setStats] = useState<ZeiterfassungStatsPayload | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [plannedSessions, setPlannedSessions] =
		useState<PlannedSession[]>([]);

	const displayStats = useMemo(
		() => (stats ? applyPlannedSessions(stats, plannedSessions) : null),
		[stats, plannedSessions],
	);

	const [entryDrawerOpen, setEntryDrawerOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<VaultTimeEntry | undefined>();
	const { startSync, endSync } = useSync();

	const loadEntries = useCallback(async () => {
		setEntriesLoading(true);
		try {
			const result = await fetchTimeEntriesPage({
				status: entriesTab,
				page: entriesPage,
				pageSize: entriesPageSize,
			});
			setEntries(result.entries);
			setEntriesTotal(result.total);
			setTotalOpen(result.totalOpen);
			setTotalPaid(result.totalPaid);
			if (result.cleanedDuplicateSlugs?.length) {
				toast.info(
					`${result.cleanedDuplicateSlugs.length} doppelte Einträge bereinigt`,
				);
			}
		} catch (err) {
			console.error("[zeiterfassung] fetchTimeEntriesPage failed", err);
			toast.error("Zeiteinträge konnten nicht geladen werden");
		} finally {
			setEntriesLoading(false);
		}
	}, [entriesTab, entriesPage, entriesPageSize]);

	const loadStats = useCallback(async () => {
		setStatsLoading(true);
		try {
			const data = await fetchZeiterfassungStats();
			setStats(data);
		} catch {
			toast.error("Statistiken konnten nicht geladen werden");
		} finally {
			setStatsLoading(false);
		}
	}, []);

	const refreshEntriesAndStats = useCallback(async () => {
		await Promise.all([loadEntries(), loadStats()]);
	}, [loadEntries, loadStats]);

	useEffect(() => {
		loadEntries();
	}, [loadEntries]);

	useEffect(() => {
		loadStats();
	}, [loadStats]);

	const handleMarkPaid = useCallback(
		(toMark: VaultTimeEntry[]) => {
			startTransition(async () => {
				try {
					await markEntriesAsPaid(toMark);
					toast.success(`${toMark.length} Eintrag als bezahlt markiert`);
					await refreshEntriesAndStats();
				} catch {
					toast.error("Fehler beim Markieren");
				}
			});
		},
		[startTransition, refreshEntriesAndStats],
	);

	const handleDelete = useCallback(
		(entry: VaultTimeEntry) => {
			if (!entry.sha) return;
			if (!confirm("Eintrag wirklich löschen?")) return;
			startTransition(async () => {
				try {
					await deleteVaultTimeEntry(entry.slug, entry.folder, entry.sha!);
					await refreshEntriesAndStats();
				} catch {
					toast.error("Fehler beim Löschen");
				}
			});
		},
		[startTransition, refreshEntriesAndStats],
	);

	const handleEntrySave = useCallback(
		async (slug: string, data: VaultTimeEntryFrontmatter, sha?: string) => {
			const folder = editTarget?.folder;
			const sessionData: VaultTimeEntryFrontmatter = {
				...data,
				trackingStatus: editTarget?.trackingStatus ?? data.trackingStatus ?? "tracked",
				goalHours: editTarget?.goalHours ?? data.goalHours,
				segmentsJson: editTarget?.segmentsJson ?? data.segmentsJson,
			};

			startSync();
			startTransition(async () => {
				try {
					if (folder === SESSIONS_FOLDER) {
						await saveTrackerSession(slug, sessionData, sha);
					} else {
						await saveTimeEntry(
							slug,
							sessionData,
							sha,
							folder ?? OPEN_FOLDER,
						);
					}
					await refreshEntriesAndStats();
				} catch {
					toast.error("Fehler beim Speichern");
					throw new Error("save failed");
				} finally {
					endSync();
				}
			});
		},
		[editTarget, startTransition, refreshEntriesAndStats, startSync, endSync],
	);

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Zeiterfassung" }]} />

			<div className="flex-1 overflow-auto p-6">
				<div className="flex items-center justify-between gap-4 mb-6">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Zeiterfassung</h1>
						<p className="text-muted-foreground">
							Tracke deine Arbeitszeit und verwalte deine Stunden.
						</p>
					</div>
					<Button
						variant="outline"
						disabled={!vaultWriteEnabled}
						onClick={() => {
							setEditTarget(
								createDraftTimeEntry(new Date().toISOString().split("T")[0]),
							);
							setEntryDrawerOpen(true);
						}}
					>
						<Plus className="size-4 mr-2" />
						Manueller Eintrag
					</Button>
				</div>

				<Tabs defaultValue="tracker">
					<TabsList className="mb-6">
						<TabsTrigger value="tracker" className="gap-2">
							<Timer className="size-4" /> Tracker
						</TabsTrigger>
						<TabsTrigger value="planung" className="gap-2">
							<CalendarClock className="size-4" /> Planung
						</TabsTrigger>
					</TabsList>

					<TabsContent value="tracker" className="space-y-6 mt-0">
						<TimeTrackerWidget
							projects={projects}
							clients={clients}
							size="full"
							onClientsChange={setClients}
							onProjectsChange={setProjects}
							onSaved={refreshEntriesAndStats}
						/>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									Zeiteinträge
									{entriesLoading && (
										<Loader2 className="size-4 animate-spin text-muted-foreground" />
									)}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{entriesLoading ? (
									<EntriesListingSkeleton />
								) : (
									<SessionsListing
										entries={entries}
										paginated
										page={entriesPage}
										pageSize={entriesPageSize}
										total={entriesTotal}
										totalOpen={totalOpen}
										totalPaid={totalPaid}
										activeTab={entriesTab}
										onPageChange={setEntriesPage}
										onPageSizeChange={(size) => {
											if (PAGE_SIZE_OPTIONS.includes(size)) {
												setEntriesPageSize(size);
												setEntriesPage(1);
											}
										}}
										onTabChange={(tab) => {
											setEntriesTab(tab);
											setEntriesPage(1);
										}}
										onEdit={(e) => {
											setEditTarget(e);
											setEntryDrawerOpen(true);
										}}
										onDelete={handleDelete}
										onMarkPaid={handleMarkPaid}
										compact
									/>
								)}
							</CardContent>
						</Card>

						<TrackerStatistics stats={displayStats} loading={statsLoading} />
					</TabsContent>

					<TabsContent value="planung" className="mt-0">
						<PlannedSessions
							sessions={plannedSessions}
							onSessionsChange={setPlannedSessions}
							clients={clients}
							projects={projects}
						/>
					</TabsContent>
				</Tabs>
			</div>

			<EntryDetailView
				open={entryDrawerOpen}
				onOpenChange={setEntryDrawerOpen}
				projects={projects}
				clients={clients}
				entry={editTarget}
				onSave={handleEntrySave}
			/>
		</>
	);
}
