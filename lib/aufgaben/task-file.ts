import { parseFrontmatter } from "@/lib/frontmatter";
import type { TaskComment, TaskPriority, TaskStatus } from "@/types/aufgaben";

const LEGACY_COMMENTS_REGEX = /<!-- mehub-task-comments\s*([\s\S]*?)\s*-->/;

function coerceOptionalString(value: unknown): string | undefined {
	if (value == null || value === false) return undefined;
	const text = typeof value === "string" ? value : String(value);
	const trimmed = text.trim();
	return trimmed || undefined;
}

function isTaskComment(value: unknown): value is TaskComment {
	if (!value || typeof value !== "object") return false;
	const c = value as Record<string, unknown>;
	return (
		typeof c.id === "string" &&
		typeof c.authorId === "string" &&
		typeof c.authorName === "string" &&
		typeof c.text === "string" &&
		typeof c.createdAt === "string"
	);
}

export function parseCommentsValue(value: unknown): TaskComment[] {
	if (Array.isArray(value)) {
		return value.filter(isTaskComment);
	}
	if (typeof value === "string" && value.trim().startsWith("[")) {
		try {
			const parsed: unknown = JSON.parse(value);
			if (Array.isArray(parsed)) return parsed.filter(isTaskComment);
		} catch {
			return [];
		}
	}
	return [];
}

function parseLegacyBodyComments(body: string): TaskComment[] {
	const match = body.match(LEGACY_COMMENTS_REGEX);
	if (!match) return [];
	try {
		const parsed: unknown = JSON.parse(match[1].trim());
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(isTaskComment);
	} catch {
		return [];
	}
}

function stripLegacyCommentsBlock(body: string): string {
	return body.replace(LEGACY_COMMENTS_REGEX, "").trim();
}

export function parseTaskBody(body: string): { title: string; description: string } {
	const stripped = stripLegacyCommentsBlock(body);
	const newlineIndex = stripped.indexOf("\n");
	const firstLine =
		newlineIndex === -1 ? stripped : stripped.slice(0, newlineIndex);

	if (!firstLine.startsWith("# ")) {
		return { title: "", description: stripped.trim() };
	}

	const title = firstLine.slice(2).trim();
	const description =
		newlineIndex === -1 ? "" : stripped.slice(newlineIndex + 1).trim();

	return { title, description };
}

export type ParsedTaskFile = {
	title: string;
	description: string;
	status: TaskStatus;
	priority: TaskPriority;
	project?: string;
	dueDate?: string;
	tags: string[];
	assignee?: string;
	comments: TaskComment[];
	createdAt?: string;
	updatedAt?: string;
};

export function parseTaskFile(raw: string, slugFallback: string): ParsedTaskFile {
	const { data, content } = parseFrontmatter(raw);
	const bodyParsed = parseTaskBody(content);

	const legacyTitle = typeof data.title === "string" ? data.title.trim() : "";
	const fmDescription =
		typeof data.description === "string" ? data.description.trim() : "";

	let comments = parseCommentsValue(data.comments);
	if (comments.length === 0) {
		comments = parseLegacyBodyComments(content);
	}

	const title = bodyParsed.title || legacyTitle || slugFallback;
	const description =
		bodyParsed.description ||
		(fmDescription && fmDescription !== title ? fmDescription : "");

	return {
		title,
		description,
		status: (data.status as TaskStatus) ?? "todo",
		priority: (data.priority as TaskPriority) ?? "medium",
		project: coerceOptionalString(data.project),
		dueDate: coerceOptionalString(data.dueDate),
		tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
		assignee: coerceOptionalString(data.assignee),
		comments,
		createdAt: data.createdAt as string | undefined,
		updatedAt: data.updatedAt as string | undefined,
	};
}

export function composeTaskBody(title: string, description: string): string {
	const heading = `# ${title.trim()}`;
	const body = description.trim();
	return body ? `${heading}\n\n${body}` : heading;
}

/** Vault stores single `\n` between lines; Tiptap markdown uses blank lines between paragraphs. */
export function taskDescriptionForEditor(text: string): string {
	const normalized = text.replace(/\r\n/g, "\n").trim();
	if (!normalized) return "";
	return normalized.split("\n").join("\n\n");
}

export function taskDescriptionFromEditor(markdown: string): string {
	const normalized = markdown.replace(/\r\n/g, "\n").trim();
	if (!normalized) return "";
	return normalized
		.split(/\n{2,}/)
		.map((block) => block.trim())
		.filter(Boolean)
		.join("\n");
}

export type TaskFilePayload = {
	title: string;
	description: string;
	status: TaskStatus;
	priority: TaskPriority;
	project?: string;
	dueDate?: string;
	tags: string[];
	assignee?: string;
	comments: TaskComment[];
	createdAt?: string;
	updatedAt?: string;
};

export function serializeTaskFile(payload: TaskFilePayload): string {
	const lines = [
		"---",
		'description: ""',
		`status: ${payload.status}`,
		`priority: ${payload.priority}`,
		`project: ${payload.project ?? ""}`,
		`dueDate: ${payload.dueDate ?? ""}`,
	];

	if (payload.tags.length === 0) {
		lines.push("tags:");
	} else {
		lines.push("tags:");
		for (const tag of payload.tags) {
			lines.push(`  - ${tag}`);
		}
	}

	lines.push(`assignee: ${payload.assignee ?? ""}`);
	lines.push(`comments: ${JSON.stringify(payload.comments)}`);

	if (payload.createdAt) {
		lines.push(`createdAt: ${payload.createdAt}`);
	}
	if (payload.updatedAt) {
		lines.push(`updatedAt: ${payload.updatedAt}`);
	}

	lines.push("---");
	return `${lines.join("\n")}\n\n${composeTaskBody(payload.title, payload.description)}`;
}
