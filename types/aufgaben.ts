export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface TaskFrontmatter {
  title: string;
  /** Markdown body below the `# title` heading in tasks/[slug].md */
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project?: string;
  dueDate?: string; // ISO "YYYY-MM-DD"
  tags: string[];
  assignee?: string; // workspace member userId
  createdAt?: string;
  updatedAt?: string;
}

export interface Task extends TaskFrontmatter {
  slug: string;
  sha?: string;
  body: string;
  comments: TaskComment[];
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  "todo":        { label: "Offen",     color: "bg-slate-500" },
  "in-progress": { label: "In Arbeit", color: "bg-blue-500" },
  "done":        { label: "Erledigt",  color: "bg-green-500" },
  "blocked":     { label: "Blockiert", color: "bg-red-500" },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low:    { label: "Niedrig", color: "text-slate-500" },
  medium: { label: "Mittel",  color: "text-amber-500" },
  high:   { label: "Hoch",    color: "text-red-500" },
};
