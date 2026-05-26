import type { Task, TaskComment } from "@/types/aufgaben";
import type { WorkspaceMemberSummary } from "@/app/actions/workspaces";

export function memberLabel(member: WorkspaceMemberSummary): string {
	return member.name?.trim() || member.email;
}

export function memberInitials(member: WorkspaceMemberSummary): string {
	const label = memberLabel(member);
	const parts = label.split(/\s+/);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}
	return label.slice(0, 2).toUpperCase();
}

export function newCommentId(): string {
	return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatCommentDate(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function tagsEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((tag, i) => tag === b[i]);
}

export function commentsEqual(a: TaskComment[], b: TaskComment[]): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function textField(value: unknown): string {
	if (typeof value === "string") return value;
	if (value == null) return "";
	return String(value);
}

export type TaskFormSnapshot = {
	title: string;
	description: string;
	status: Task["status"];
	priority: Task["priority"];
	project: string;
	dueDate: string;
	tags: string[];
	assignee: string;
	comments: TaskComment[];
};

export function taskToSnapshot(task: Task): TaskFormSnapshot {
	return {
		title: task.title.trim(),
		description: (task.description ?? "").trim(),
		status: task.status,
		priority: task.priority,
		project: textField(task.project),
		dueDate: task.dueDate ?? "",
		tags: Array.isArray(task.tags) ? task.tags : [],
		assignee: task.assignee ?? "",
		comments: task.comments ?? [],
	};
}

export function snapshotsEqual(a: TaskFormSnapshot, b: TaskFormSnapshot): boolean {
	return (
		a.title === b.title &&
		a.description === b.description &&
		a.status === b.status &&
		a.priority === b.priority &&
		a.project === b.project &&
		a.dueDate === b.dueDate &&
		tagsEqual(a.tags, b.tags) &&
		a.assignee === b.assignee &&
		commentsEqual(a.comments, b.comments)
	);
}
