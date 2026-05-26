import {
	sumPlannedHoursForDate,
	sumPlannedHoursForMonth,
	sumPlannedHoursForWeek,
} from "@/lib/zeiterfassung/planned";
import type { PlannedSession, VaultTimeEntry } from "@/types/zeiterfassung";

export const COLOR_WORK_TODAY = "hsl(25, 95%, 53%)";
export const COLOR_WORK_PAST = "hsl(48, 96%, 53%)";
export const COLOR_PLANNED = "hsl(210, 55%, 58%)";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function getWeekBounds() {
	const now = new Date();
	const day = now.getDay();
	const monday = new Date(now);
	monday.setDate(now.getDate() - ((day + 6) % 7));
	monday.setHours(0, 0, 0, 0);
	return { monday };
}

function getMonthBounds() {
	const now = new Date();
	return {
		start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
		end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
	};
}

export interface ZeiterfassungStatsPayload {
	weekData: {
		label: string;
		date: string;
		hours: number;
		plannedHours: number;
		isToday: boolean;
	}[];
	weekStats: { totalHours: number; openRevenue: number; projectCount: number };
	weekPlannedHours: number;
	monthStats: { totalHours: number; openRevenue: number; projectCount: number };
	monthPlannedHours: number;
	allStats: {
		totalHours: number;
		openRevenue: number;
		paidRevenue: number;
		projectCount: number;
	};
	allPlannedHours: number;
}

export function buildZeiterfassungStats(
	entries: VaultTimeEntry[],
	plannedSessions: PlannedSession[] = [],
): ZeiterfassungStatsPayload {
	const today = new Date().toISOString().split("T")[0];
	const { monday } = getWeekBounds();
	const days = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		return d.toISOString().split("T")[0];
	});

	const byDay: Record<string, number> = {};
	for (const entry of entries) {
		if (days.includes(entry.date)) {
			byDay[entry.date] = (byDay[entry.date] ?? 0) + entry.hours;
		}
	}

	const pending = plannedSessions.filter((s) => !s.completed);

	const weekData = days.map((date, i) => ({
		label: WEEKDAY_LABELS[i],
		date,
		hours: byDay[date] ?? 0,
		plannedHours: sumPlannedHoursForDate(pending, date),
		isToday: date === today,
	}));

	const weekEntries = entries.filter((e) => days.includes(e.date));
	const weekStats = {
		totalHours: weekData.reduce((s, d) => s + d.hours, 0),
		openRevenue: weekEntries
			.filter((e) => e.status === "open" && e.billable)
			.reduce((s, e) => s + e.hours * e.rate, 0),
		projectCount: new Set(weekEntries.map((e) => e.projectSlug)).size,
	};

	const { start, end } = getMonthBounds();
	const monthEntries = entries.filter((e) => e.date >= start && e.date <= end);
	const monthStats = {
		totalHours: monthEntries.reduce((s, e) => s + e.hours, 0),
		openRevenue: monthEntries
			.filter((e) => e.status === "open" && e.billable)
			.reduce((s, e) => s + e.hours * e.rate, 0),
		projectCount: new Set(monthEntries.map((e) => e.projectSlug)).size,
	};

	const allStats = {
		totalHours: entries.reduce((s, e) => s + e.hours, 0),
		openRevenue: entries
			.filter((e) => e.status === "open" && e.billable)
			.reduce((s, e) => s + e.hours * e.rate, 0),
		paidRevenue: entries
			.filter((e) => e.status === "paid" && e.billable)
			.reduce((s, e) => s + e.hours * e.rate, 0),
		projectCount: new Set(entries.map((e) => e.projectSlug)).size,
	};

	return {
		weekData,
		weekStats,
		weekPlannedHours: sumPlannedHoursForWeek(pending, days),
		monthStats,
		monthPlannedHours: sumPlannedHoursForMonth(pending, start, end),
		allStats,
		allPlannedHours: pending.reduce((s, p) => s + p.goalHours, 0),
	};
}

/** Recompute planned-hour fields when the Planung tab changes sessions client-side. */
export function applyPlannedSessions(
	stats: ZeiterfassungStatsPayload,
	plannedSessions: PlannedSession[],
): ZeiterfassungStatsPayload {
	const pending = plannedSessions.filter((s) => !s.completed);
	const weekDates = stats.weekData.map((d) => d.date);
	const { start: monthStart, end: monthEnd } = getMonthBounds();

	return {
		...stats,
		weekData: stats.weekData.map((day) => ({
			...day,
			plannedHours: sumPlannedHoursForDate(pending, day.date),
		})),
		weekPlannedHours: sumPlannedHoursForWeek(pending, weekDates),
		monthPlannedHours: sumPlannedHoursForMonth(pending, monthStart, monthEnd),
		allPlannedHours: pending.reduce((s, p) => s + p.goalHours, 0),
	};
}

export function getWeekBarFill(
	entry: { date: string; hours: number; isToday: boolean },
	today: string,
): string {
	if (entry.date > today) return "hsl(var(--muted))";
	if (entry.isToday && entry.hours > 0) return COLOR_WORK_TODAY;
	if (entry.hours > 0) return COLOR_WORK_PAST;
	return "hsl(var(--muted))";
}
