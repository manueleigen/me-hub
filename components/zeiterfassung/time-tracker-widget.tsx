"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonutTimer } from "@/components/zeiterfassung/donut-timer";
import { TimerControls } from "@/components/zeiterfassung/timer-controls";
import { SessionSegments } from "@/components/zeiterfassung/session-segments";
import { SessionFormPanel } from "@/components/zeiterfassung/session-form-panel";
import { useTimerContext, type TimerFormData } from "@/lib/timer-context";
import { saveTrackerSession } from "@/app/actions/zeiterfassung";
import type { VaultTimeEntryFrontmatter } from "@/types/zeiterfassung";
import type { Project } from "@/types/projects";
import type { Client } from "@/types/clients";
import { cn } from "@/lib/utils";

export type TimeTrackerPrefill = Partial<TimerFormData>;

export type TimeTrackerWidgetProps = {
	projects: Project[];
	clients: Client[];
	prefill?: TimeTrackerPrefill;
	prefillKey?: string;
	title?: string;
	formTitle?: string;
	showDescription?: boolean;
	/** compact = embedded (task detail); full = main zeiterfassung page */
	size?: "compact" | "full";
	/** inline = timer + form side-by-side (narrow embeds) */
	layout?: "split" | "inline";
	onClientsChange?: (clients: Client[]) => void;
	onProjectsChange?: (projects: Project[]) => void;
	onSaved?: () => void;
	className?: string;
};

export function TimeTrackerWidget({
	projects: initialProjects,
	clients: initialClients,
	prefill,
	prefillKey,
	title,
	formTitle,
	showDescription = true,
	size = "compact",
	layout = "split",
	onClientsChange,
	onProjectsChange,
	onSaved,
	className,
}: TimeTrackerWidgetProps) {
	const isCompact = size === "compact";
	const isInline = layout === "inline";
	const timer = useTimerContext();
	const [isPending, startTransition] = useTransition();
	const [projects, setProjects] = useState(initialProjects);
	const [clients, setClients] = useState(initialClients);

	useEffect(() => {
		setProjects(initialProjects);
		setClients(initialClients);
	}, [initialProjects, initialClients]);

	useEffect(() => {
		if (timer.status !== "idle" || !prefill) return;
		timer.setFormData(prefill);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		prefillKey,
		prefill?.clientSlug,
		prefill?.projectSlug,
		prefill?.description,
	]);

	const workMinutes = timer.calculateWorkMinutes();
	const hasData =
		timer.segments.length > 0 || timer.formData.description.length > 0;

	const handleClientsChange = (next: Client[]) => {
		setClients(next);
		onClientsChange?.(next);
	};

	const handleProjectsChange = (next: Project[]) => {
		setProjects(next);
		onProjectsChange?.(next);
	};

	const handleSaveSession = () => {
		const sessionWorkMinutes = timer.calculateWorkMinutes();
		if (sessionWorkMinutes === 0 && timer.segments.length === 0) {
			toast.error("Keine Zeit erfasst");
			return;
		}

		if (timer.status !== "idle") timer.stop();

		const date = new Date().toISOString().split("T")[0];
		const rand = Math.random().toString(36).slice(2, 8);
		const slug = `${date}-${timer.formData.projectSlug || "session"}-${rand}`;
		const hours = Math.max(sessionWorkMinutes / 60, 0.25);

		const data: VaultTimeEntryFrontmatter = {
			projectSlug: timer.formData.projectSlug || "unknown",
			projectName: timer.formData.projectName || "Session",
			clientSlug: timer.formData.clientSlug || undefined,
			clientName: timer.formData.clientName || undefined,
			date,
			hours: Math.round(hours * 4) / 4,
			description: timer.formData.description,
			rate: timer.formData.hourlyRate,
			billable: timer.formData.billable,
			trackingStatus: "tracked",
			goalHours: timer.formData.goalHours,
			segmentsJson: JSON.stringify(timer.segments),
		};

		startTransition(async () => {
			try {
				await saveTrackerSession(slug, data);
				timer.reset();
				if (prefill) timer.setFormData(prefill);
				toast.success("Session gespeichert");
				onSaved?.();
			} catch {
				toast.error("Fehler beim Speichern");
			}
		});
	};

	const timerMinH = isCompact ? "min-h-0" : "min-h-[420px]";
	const segmentsMinH = isCompact ? "min-h-0" : "min-h-[420px]";
	const panelPad = isCompact
		? isInline
			? "p-2.5 sm:p-3"
			: "p-4"
		: "p-6 lg:p-8";
	const headerPad = isCompact
		? isInline
			? "px-2.5 sm:px-3 pt-2 pb-1"
			: "px-4 pt-3 pb-2"
		: "px-6 pt-5 pb-3";
	const timerPad = isCompact
		? isInline
			? "p-2.5 sm:p-3 pt-0 pb-2.5 sm:pb-3"
			: "p-4 pt-0 pb-4"
		: "p-8 pt-0";

	const panel = (
		<div
			className={cn(
				"grid gap-0 items-start",
				isInline ? "sm:grid-cols-2" : "lg:grid-cols-2",
			)}
		>
			<div
				className={cn(
					"border-b",
					isInline
						? "sm:border-b-0 sm:border-r"
						: "lg:border-b-0 lg:border-r",
				)}
			>
				<Tabs defaultValue="timer">
					<div
						className={cn(
							"flex items-center gap-2 justify-end",
							headerPad,
						)}
					>
						<TabsList className={isCompact ? "h-8" : undefined}>
							<TabsTrigger
								value="timer"
								className={isCompact ? "text-xs px-2.5 h-7" : undefined}
							>
								Timer
							</TabsTrigger>
							<TabsTrigger
								value="session-zeiten"
								className={isCompact ? "text-xs px-2.5 h-7" : undefined}
							>
								Session Zeiten
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="timer" className="mt-0">
						<div
							className={cn(
								"flex flex-col items-center justify-center",
								timerPad,
								timerMinH,
							)}
						>
							<DonutTimer
								segments={timer.segments}
								hours={timer.hours}
								minutes={timer.minutes}
								seconds={timer.seconds}
								goalHours={timer.formData.goalHours}
								onGoalHoursChange={(h) => timer.setFormData({ goalHours: h })}
								isRunning={timer.status === "running"}
								isPaused={timer.status === "paused"}
								compact={isCompact}
								compactSize={isInline ? "small" : "default"}
							/>
							<div
								className={
									isCompact ? (isInline ? "mt-2" : "mt-3") : "mt-6"
								}
							>
								<TimerControls
									status={timer.status}
									onStart={timer.start}
									onPause={timer.pause}
									onResume={timer.resume}
									onStop={timer.stop}
									onReset={timer.reset}
									hasSegments={timer.segments.length > 0}
									compact={isCompact}
									compactSize={isInline ? "small" : "default"}
								/>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="session-zeiten" className="mt-0">
						<div className={cn(panelPad, segmentsMinH)}>
							<SessionSegments
								segments={timer.segments}
								totalWorkMinutes={workMinutes}
								goalHours={timer.formData.goalHours}
								onUpdateSegment={timer.updateSegment}
								onDeleteSegment={timer.deleteSegment}
								compact={isCompact}
							/>
						</div>
					</TabsContent>
				</Tabs>
			</div>

			<div className={panelPad}>
				<SessionFormPanel
					projects={projects}
					clients={clients}
					onClientsChange={handleClientsChange}
					onProjectsChange={handleProjectsChange}
					onSave={handleSaveSession}
					onReset={timer.reset}
					hasData={hasData}
					isSaving={isPending}
					title={formTitle}
					showDescription={showDescription}
					compact={isCompact}
					dense={isCompact && !showDescription}
				/>
			</div>
		</div>
	);

	if (title) {
		return (
			<Card className={cn(className)}>
				<CardHeader className="pb-2 pt-4 px-4">
					<CardTitle className="text-base">{title}</CardTitle>
				</CardHeader>
				<CardContent className="p-0">{panel}</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn(className)}>
			<CardContent className="p-0">{panel}</CardContent>
		</Card>
	);
}
