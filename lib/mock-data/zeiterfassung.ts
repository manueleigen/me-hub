import type { TimeEntry } from "@/types/zeiterfassung";

// Mock clients/projects
export const mockProjects = [
	{ id: "modulap", name: "Modulap", client: "Modulap GmbH", rate: 85 },
	{
		id: "specialolympics",
		name: "Special Olympics",
		client: "Special Olympics",
		rate: 75,
	},
	{ id: "personal-hub", name: "MeHub", client: "Internal", rate: 0 },
	{
		id: "beispiel-gmbh",
		name: "Beispiel GmbH",
		client: "Beispiel GmbH",
		rate: 120,
	},
];

// Generate mock time entries for the past month
function generateMockEntries(): TimeEntry[] {
	const entries: TimeEntry[] = [];
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();

	// Generate entries for the current month
	const tasks = [
		{ task: "Design Review", tags: ["design", "meeting"] },
		{ task: "Icon Set finalisiert", tags: ["design", "icons"] },
		{ task: "Konfigurator Development", tags: ["development", "frontend"] },
		{ task: "Bug Fixes", tags: ["development", "bugfix"] },
		{ task: "Dokumentation", tags: ["docs"] },
		{ task: "Kundentermin", tags: ["meeting", "client"] },
		{ task: "Code Review", tags: ["development", "review"] },
		{ task: "Feature Implementation", tags: ["development"] },
	];

	for (let day = 1; day <= now.getDate(); day++) {
		const date = new Date(year, month, day);
		// Skip weekends
		if (date.getDay() === 0 || date.getDay() === 6) continue;

		// 1-3 entries per day
		const entriesPerDay = Math.floor(Math.random() * 3) + 1;

		for (let i = 0; i < entriesPerDay; i++) {
			const project =
				mockProjects[Math.floor(Math.random() * mockProjects.length)];
			const taskData = tasks[Math.floor(Math.random() * tasks.length)];
			const hours = Math.round((Math.random() * 4 + 1) * 2) / 2; // 1-5 hours in 0.5 increments

			entries.push({
				id: `entry-${day}-${i}`,
				date: date.toISOString().split("T")[0],
				project: project.id,
				task: taskData.task,
				hours,
				description: `${taskData.task} fuer ${project.name}`,
				billable: project.rate > 0,
				rate: project.rate,
				tags: [...taskData.tags, project.id],
				createdAt: date,
				updatedAt: date,
			});
		}
	}

	return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export let mockTimeEntries: TimeEntry[] = generateMockEntries();

// Helper functions
export function getEntriesByDate(date: string): TimeEntry[] {
	return mockTimeEntries.filter((e) => e.date === date);
}

export function getEntriesByDateRange(
	startDate: string,
	endDate: string,
): TimeEntry[] {
	return mockTimeEntries.filter(
		(e) => e.date >= startDate && e.date <= endDate,
	);
}

export function getEntriesByProject(projectId: string): TimeEntry[] {
	return mockTimeEntries.filter((e) => e.project === projectId);
}

export function addTimeEntry(
	entry: Omit<TimeEntry, "id" | "createdAt" | "updatedAt">,
): TimeEntry {
	const newEntry: TimeEntry = {
		...entry,
		id: `entry-${Date.now()}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	mockTimeEntries = [newEntry, ...mockTimeEntries];
	return newEntry;
}

export function updateTimeEntry(
	id: string,
	updates: Partial<TimeEntry>,
): TimeEntry | null {
	const index = mockTimeEntries.findIndex((e) => e.id === id);
	if (index === -1) return null;

	mockTimeEntries[index] = {
		...mockTimeEntries[index],
		...updates,
		updatedAt: new Date(),
	};
	return mockTimeEntries[index];
}

export function deleteTimeEntry(id: string): boolean {
	const index = mockTimeEntries.findIndex((e) => e.id === id);
	if (index === -1) return false;

	mockTimeEntries.splice(index, 1);
	return true;
}

export function getProjectById(id: string) {
	return mockProjects.find((p) => p.id === id);
}

export function calculateDaySummary(date: string) {
	const entries = getEntriesByDate(date);
	return {
		date,
		totalHours: entries.reduce((sum, e) => sum + e.hours, 0),
		entries,
	};
}

export function calculateWeekSummary(weekStart: Date) {
	const days = [];
	let totalHours = 0;
	let billableHours = 0;
	let totalRevenue = 0;

	for (let i = 0; i < 7; i++) {
		const date = new Date(weekStart);
		date.setDate(date.getDate() + i);
		const dateStr = date.toISOString().split("T")[0];
		const daySummary = calculateDaySummary(dateStr);
		days.push(daySummary);

		totalHours += daySummary.totalHours;
		daySummary.entries.forEach((e) => {
			if (e.billable) {
				billableHours += e.hours;
				totalRevenue += e.hours * e.rate;
			}
		});
	}

	// Get week number
	const firstDayOfYear = new Date(weekStart.getFullYear(), 0, 1);
	const weekNumber = Math.ceil(
		((weekStart.getTime() - firstDayOfYear.getTime()) / 86400000 +
			firstDayOfYear.getDay() +
			1) /
			7,
	);

	return {
		weekNumber,
		year: weekStart.getFullYear(),
		startDate: weekStart.toISOString().split("T")[0],
		endDate: new Date(weekStart.getTime() + 6 * 86400000)
			.toISOString()
			.split("T")[0],
		totalHours,
		billableHours,
		totalRevenue,
		days,
	};
}

export function calculateMonthSummary(year: number, month: number) {
	const startDate = new Date(year, month, 1).toISOString().split("T")[0];
	const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
	const entries = getEntriesByDateRange(startDate, endDate);

	let totalHours = 0;
	let billableHours = 0;
	let totalRevenue = 0;
	const projectMap = new Map<
		string,
		{ hours: number; billableHours: number; revenue: number; entries: number }
	>();

	entries.forEach((e) => {
		totalHours += e.hours;
		if (e.billable) {
			billableHours += e.hours;
			totalRevenue += e.hours * e.rate;
		}

		const project = projectMap.get(e.project) || {
			hours: 0,
			billableHours: 0,
			revenue: 0,
			entries: 0,
		};
		project.hours += e.hours;
		project.entries += 1;
		if (e.billable) {
			project.billableHours += e.hours;
			project.revenue += e.hours * e.rate;
		}
		projectMap.set(e.project, project);
	});

	const projectBreakdown = Array.from(projectMap.entries()).map(
		([project, data]) => ({
			project,
			totalHours: data.hours,
			billableHours: data.billableHours,
			totalRevenue: data.revenue,
			entries: data.entries,
		}),
	);

	return {
		month,
		year,
		totalHours,
		billableHours,
		totalRevenue,
		projectBreakdown,
	};
}
