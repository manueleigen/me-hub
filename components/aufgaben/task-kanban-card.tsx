"use client";

import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KanbanEntityCard } from "@/components/entity/kanban-entity-card";
import type { Task } from "@/types/aufgaben";
import { PRIORITY_CONFIG } from "@/types/aufgaben";
import type { KanbanColumn } from "@/components/kanban-board";

interface TaskKanbanCardProps {
	task: Task;
	columns: KanbanColumn[];
	onOpen: () => void;
	onDelete: () => void;
	onMoveToColumn: (columnKey: string) => Promise<void>;
}

export function TaskKanbanCard({
	task,
	columns,
	onOpen,
	onDelete,
	onMoveToColumn,
}: TaskKanbanCardProps) {
	const formattedDate = task.dueDate
		? new Date(task.dueDate + "T00:00:00").toLocaleDateString("de-DE", {
				day: "2-digit",
				month: "2-digit",
			})
		: null;

	return (
		<KanbanEntityCard
			title={task.title}
			description={task.description}
			status={task.status}
			columns={columns}
			priorityLabel={PRIORITY_CONFIG[task.priority]?.label}
			priorityClassName={PRIORITY_CONFIG[task.priority]?.color}
			meta={
				<>
					{task.project && (
						<Badge variant="outline" className="text-xs">
							{task.project}
						</Badge>
					)}
					{formattedDate && (
						<span className="text-xs text-muted-foreground flex items-center gap-0.5">
							<Calendar className="size-3" />
							{formattedDate}
						</span>
					)}
				</>
			}
			onOpen={onOpen}
			onDelete={onDelete}
			onMoveToColumn={onMoveToColumn}
		/>
	);
}
