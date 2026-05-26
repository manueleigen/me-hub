"use client";

import { UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { MarkdownBodyEditor } from "@/components/editor/markdown-body-editor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppSelect } from "@/components/app-select";
import { optionsFromConfig } from "@/lib/app-select-options";
import { TagInput } from "@/components/tag-input";
import {
	taskDescriptionForEditor,
	taskDescriptionFromEditor,
} from "@/lib/aufgaben/task-file";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/aufgaben";
import type { TaskPriority, TaskStatus } from "@/types/aufgaben";
import type { WorkspaceMemberSummary } from "@/app/actions/workspaces";
import { memberInitials, memberLabel } from "./utils";

const taskStatusOptions = optionsFromConfig(STATUS_CONFIG);
const taskPriorityOptions = optionsFromConfig(PRIORITY_CONFIG);

type TaskDetailFieldsProps = {
	editorKey: string;
	title: string;
	description: string;
	status: TaskStatus;
	priority: TaskPriority;
	project: string;
	dueDate: string;
	tags: string[];
	assignee: string;
	members: WorkspaceMemberSummary[];
	disabled?: boolean;
	onStatusChange: (value: TaskStatus) => void;
	onPriorityChange: (value: TaskPriority) => void;
	onProjectChange: (value: string) => void;
	onDueDateChange: (value: string) => void;
	onTagsChange: (value: string[]) => void;
	onAssigneeChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
};

export function TaskDetailFields({
	editorKey,
	description,
	status,
	priority,
	project,
	dueDate,
	tags,
	assignee,
	members,
	disabled,
	onStatusChange,
	onPriorityChange,
	onProjectChange,
	onDueDateChange,
	onTagsChange,
	onAssigneeChange,
	onDescriptionChange,
}: TaskDetailFieldsProps) {
	const assigneeMember = members.find((m) => m.userId === assignee);

	return (
		<>
			<section className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label>Status</Label>
					<AppSelect
						variant="pill"
						value={status}
						onValueChange={(v) => onStatusChange(v as TaskStatus)}
						options={taskStatusOptions}
						disabled={disabled}
					/>
				</div>

				<div className="space-y-1.5">
					<Label>Priorität</Label>
					<AppSelect
						variant="colored"
						value={priority}
						onValueChange={(v) => onPriorityChange(v as TaskPriority)}
						options={taskPriorityOptions}
						disabled={disabled}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="task-detail-project">Projekt</Label>
					<Input
						id="task-detail-project"
						value={project}
						onChange={(e) => onProjectChange(e.target.value)}
						disabled={disabled}
						placeholder="z.B. Aurora Design System"
					/>
				</div>

				<div className="space-y-1.5">
					<Label>Fälligkeitsdatum</Label>
					<DatePicker
						value={dueDate}
						onChange={onDueDateChange}
						disabled={disabled}
						placeholder="Datum wählen"
					/>
				</div>

				<div className="space-y-1.5 sm:col-span-2">
					<Label className="flex items-center gap-1.5">
						<UserRound className="size-3.5" />
						Zugewiesen an
					</Label>
					<Select
						value={assignee || "__none__"}
						onValueChange={(v) => onAssigneeChange(v === "__none__" ? "" : v)}
						disabled={disabled}
					>
						<SelectTrigger>
							<SelectValue placeholder="Nicht zugewiesen">
								{assigneeMember ? (
									<span className="flex items-center gap-2">
										<Avatar size="sm">
											{assigneeMember.image ? (
												<AvatarImage src={assigneeMember.image} alt="" />
											) : null}
											<AvatarFallback>
												{memberInitials(assigneeMember)}
											</AvatarFallback>
										</Avatar>
										{memberLabel(assigneeMember)}
									</span>
								) : (
									"Nicht zugewiesen"
								)}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__none__">Nicht zugewiesen</SelectItem>
							{members.map((member) => (
								<SelectItem key={member.userId} value={member.userId}>
									<span className="flex items-center gap-2">
										<Avatar size="sm">
											{member.image ? (
												<AvatarImage src={member.image} alt="" />
											) : null}
											<AvatarFallback>{memberInitials(member)}</AvatarFallback>
										</Avatar>
										{memberLabel(member)}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5 sm:col-span-2">
					<Label>Tags</Label>
					<TagInput values={tags} onChange={onTagsChange} />
				</div>
			</section>

			<section className="space-y-2">
				<Label>Beschreibung</Label>
				<MarkdownBodyEditor
					editorKey={editorKey}
					value={taskDescriptionForEditor(description)}
					onChange={(md) => onDescriptionChange(taskDescriptionFromEditor(md))}
					editable={!disabled}
					rawPlaceholder="Markdown-Beschreibung…"
				/>
			</section>
		</>
	);
}
