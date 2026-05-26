import type { TimeSegment } from "@/types/zeiterfassung";

export const COLOR_WORK = "hsl(25, 95%, 53%)";
export const COLOR_PAUSE = "hsl(270, 50%, 32%)";
export const COLOR_REMAINING = "#393939";

export type DonutChartSlice = {
	id: string;
	type: "work" | "pause" | "remaining";
	minutes: number;
	fill: string;
	label: string;
};

function parseTimeToMinutes(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}

/** Minutes for a segment; uses `now` when endTime is null (live segment). */
export function getSegmentMinutes(
	segment: TimeSegment,
	now = new Date(),
): number {
	const start = parseTimeToMinutes(segment.startTime);
	if (segment.endTime) {
		const end = parseTimeToMinutes(segment.endTime);
		return Math.max(0, end - start);
	}
	const nowMins = now.getHours() * 60 + now.getMinutes();
	return Math.max(0, nowMins - start);
}

/** Work goal in minutes (Ziel = reine Arbeitszeit). */
export function getWorkGoalMinutes(goalHours: number): number {
	return Math.max(goalHours * 60, 1);
}

/** Ring capacity = Arbeitsziel + Pausen (Pausen verlängern den Ring, nicht das Arbeitsziel). */
export function getDonutRingCapacityMinutes(
	slices: DonutChartSlice[],
	goalHours: number,
): number {
	const workGoalMinutes = getWorkGoalMinutes(goalHours);
	const pauseMinutes = slices
		.filter((s) => s.type === "pause")
		.reduce((sum, s) => sum + s.minutes, 0);
	return workGoalMinutes + pauseMinutes;
}

export function buildDonutChartSlices(
	segments: TimeSegment[],
	goalHours: number,
	now = new Date(),
): DonutChartSlice[] {
	const workGoalMinutes = getWorkGoalMinutes(goalHours);
	const slices: DonutChartSlice[] = [];
	let workMinutes = 0;

	for (const segment of segments) {
		const minutes = getSegmentMinutes(segment, now);
		if (minutes <= 0) continue;
		if (segment.type === "work") workMinutes += minutes;
		slices.push({
			id: segment.id,
			type: segment.type,
			minutes,
			fill: segment.type === "work" ? COLOR_WORK : COLOR_PAUSE,
			label: segment.type === "work" ? "Arbeit" : "Pause",
		});
	}

	const remainingWorkMinutes = Math.max(0, workGoalMinutes - workMinutes);
	if (remainingWorkMinutes > 0 || slices.length === 0) {
		slices.push({
			id: "remaining",
			type: "remaining",
			minutes: slices.length === 0 ? workGoalMinutes : remainingWorkMinutes,
			fill: COLOR_REMAINING,
			label: "Offen",
		});
	}

	return slices;
}

/** Recharts pie data: % of ring (Arbeitsziel + Pausen). */
export function donutSlicesToChartData(
	slices: DonutChartSlice[],
	goalHours: number,
): { name: string; value: number; fill: string }[] {
	const capacity = Math.max(getDonutRingCapacityMinutes(slices, goalHours), 1);
	return slices.map((s) => ({
		name: s.id,
		value: (s.minutes / capacity) * 100,
		fill: s.fill,
	}));
}
