"use client";

import { Calendar } from "lucide-react";
import { DetailDrawerTitle } from "@/components/detail-drawer/detail-drawer-title";
import { Badge } from "@/components/ui/badge";

type TaskDetailHeaderProps = {
	title: string;
	project: string;
	dueDate: string;
	disabled?: boolean;
	onTitleChange: (value: string) => void;
};

export function TaskDetailHeader({
	title,
	project,
	dueDate,
	disabled,
	onTitleChange,
}: TaskDetailHeaderProps) {
	return (
		<div className="space-y-2">
			<DetailDrawerTitle
				id="task-detail-title"
				value={title}
				onChange={onTitleChange}
				disabled={disabled}
				placeholder="Aufgabentitel"
			/>
		</div>
	);
}
