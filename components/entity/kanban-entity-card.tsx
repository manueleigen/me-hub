"use client";

import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ArrowRight,
	GripVertical,
	MoreVertical,
	Pencil,
	Trash2,
} from "lucide-react";
import type { KanbanColumn } from "@/components/kanban-board";
import { cn } from "@/lib/utils";

type KanbanEntityCardProps = {
	title: string;
	description?: string;
	status: string;
	columns: KanbanColumn[];
	priorityLabel?: string;
	priorityClassName?: string;
	meta?: ReactNode;
	onOpen: () => void;
	onDelete: () => void;
	onMoveToColumn: (columnKey: string) => Promise<void>;
};

export function KanbanEntityCard({
	title,
	description,
	status,
	columns,
	priorityLabel,
	priorityClassName,
	meta,
	onOpen,
	onDelete,
	onMoveToColumn,
}: KanbanEntityCardProps) {
	return (
		<Card
			className="transition-shadow hover:shadow-md cursor-pointer"
			onClick={onOpen}
		>
			<CardHeader className="p-3 pb-2">
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-1 min-w-0">
						<GripVertical
							className="size-4 text-muted-foreground shrink-0"
							onClick={(e) => e.stopPropagation()}
						/>
						<CardTitle className="text-sm font-medium line-clamp-2">
							{title}
						</CardTitle>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-6 shrink-0"
								onClick={(e) => e.stopPropagation()}
							>
								<MoreVertical className="size-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
							<DropdownMenuItem onClick={onOpen}>
								<Pencil className="mr-2 size-4" />
								Öffnen
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							{columns
								.filter((col) => col.key !== status)
								.map((col) => (
									<DropdownMenuItem
										key={col.key}
										onClick={() => onMoveToColumn(col.key)}
									>
										<ArrowRight className="mr-2 size-4" />
										Nach {col.label}
									</DropdownMenuItem>
								))}
							<DropdownMenuSeparator />
							<DropdownMenuItem className="text-destructive" onClick={onDelete}>
								<Trash2 className="mr-2 size-4" />
								Löschen
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent className="p-3 pt-0">
				{description && (
					<CardDescription className="text-xs line-clamp-2 mb-2">
						{description}
					</CardDescription>
				)}
				<div className="flex items-center gap-2 flex-wrap">
					{meta}
					{priorityLabel && (
						<span className={cn("text-xs font-medium", priorityClassName)}>
							{priorityLabel}
						</span>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
