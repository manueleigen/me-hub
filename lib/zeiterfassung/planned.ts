import type { PlannedSession } from "@/types/zeiterfassung";

/** Planned hours attributed to a single calendar day. */
export function plannedHoursForDate(
	session: PlannedSession,
	date: string,
): number {
	if (session.completed) return 0;
	if (session.recurrence === "daily") return session.goalHours;
	if (session.recurrence === "weekly" && session.recurrenceDay !== undefined) {
		const dow = new Date(`${date}T12:00:00`).getDay();
		return dow === session.recurrenceDay ? session.goalHours : 0;
	}
	if (session.deadline === date) return session.goalHours;
	return 0;
}

export function sumPlannedHoursForDate(
	sessions: PlannedSession[],
	date: string,
): number {
	return sessions
		.filter((s) => !s.completed)
		.reduce((sum, s) => sum + plannedHoursForDate(s, date), 0);
}

export function sumPlannedHoursForWeek(
	sessions: PlannedSession[],
	weekDates: string[],
): number {
	const pending = sessions.filter((s) => !s.completed);
	const byDay = weekDates.reduce(
		(sum, date) => sum + sumPlannedHoursForDate(pending, date),
		0,
	);
	const unscheduled = pending
		.filter((s) => s.recurrence === "none" && !s.deadline)
		.reduce((sum, s) => sum + s.goalHours, 0);
	return byDay + unscheduled;
}

export function sumPlannedHoursForMonth(
	sessions: PlannedSession[],
	monthStart: string,
	monthEnd: string,
): number {
	const pending = sessions.filter((s) => !s.completed);
	return pending.reduce(
		(sum, s) =>
			sum + (plannedHoursInMonth(s, monthStart, monthEnd) ? s.goalHours : 0),
		0,
	);
}

function plannedHoursInMonth(
	session: PlannedSession,
	monthStart: string,
	monthEnd: string,
): boolean {
	if (
		session.deadline &&
		session.deadline >= monthStart &&
		session.deadline <= monthEnd
	) {
		return true;
	}
	if (session.recurrence === "daily" || session.recurrence === "weekly") {
		return true;
	}
	return session.recurrence === "none" && !session.deadline;
}
