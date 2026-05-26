import { DRAFT_RECORD_SLUG } from "@/lib/detail-drawer/constants";
import type { Task } from "@/types/aufgaben";

export function createDraftTask(): Task {
	return {
		slug: DRAFT_RECORD_SLUG,
		title: "",
		description: "",
		status: "todo",
		priority: "medium",
		tags: [],
		body: "",
		comments: [],
	};
}
