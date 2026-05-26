import type { Task } from "@/types/aufgaben";
import type { Project } from "@/types/projects";

/** Tasks may reference a project by slug or display title in frontmatter. */
export function taskMatchesProject(task: Task, project: Project): boolean {
	const key = task.project?.trim();
	if (!key) return false;
	return key === project.slug || key === project.title;
}

export function findProjectForTask(
	task: Task,
	projects: Project[],
): Project | null {
	const key = task.project?.trim();
	if (!key) return null;
	return (
		projects.find((p) => p.slug === key || p.title === key) ?? null
	);
}
