"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { projectDetailPath } from "@/lib/workspace-paths";
import type { Project } from "@/types/projects";

const TYPE_COLORS: Record<string, string> = {
	freelance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
	job: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
	personal:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

const TYPE_LABELS: Record<string, string> = {
	freelance: "Freelance",
	job: "Job",
	personal: "Persönlich",
};

interface ProjectCardProps {
	project: Project;
	onEdit: (project: Project) => void;
	onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
	const workspaceSlug = useWorkspace()?.workspace.slug;
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleDelete = () => {
		setDeleting(true);
		try {
			onDelete(project);
		} finally {
			setDeleting(false);
			setConfirmOpen(false);
		}
	};

	return (
		<>
			<Card className="flex flex-col hover:shadow-md transition-shadow">
				<CardHeader className="pb-2">
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1 min-w-0">
							<Link
								href={projectDetailPath(workspaceSlug, project.slug)}
								className="font-semibold text-sm leading-tight truncate hover:underline block"
							>
								{project.title}
							</Link>
							{project.clientName && (
								<p className="text-xs text-muted-foreground mt-0.5 truncate">
									{project.clientName}
								</p>
							)}
						</div>
						<Badge
							className={`text-xs shrink-0 ${TYPE_COLORS[project.type] ?? ""}`}
						>
							{TYPE_LABELS[project.type] ?? project.type}
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="flex-1 pb-2">
					{project.category.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-2">
							{project.category.map((c) => (
								<Badge key={c} variant="outline" className="text-xs">
									{c}
								</Badge>
							))}
						</div>
					)}
					{project.tools.length > 0 && (
						<p className="text-xs text-muted-foreground">
							{project.tools.join(" · ")}
						</p>
					)}
					{project.area.length > 0 && (
						<p className="text-xs text-muted-foreground mt-1">{project.area}</p>
					)}
				</CardContent>

				<CardFooter className="pt-2 justify-end gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={() => onEdit(project)}
					>
						<Pencil className="size-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-7 text-destructive hover:text-destructive"
						onClick={() => setConfirmOpen(true)}
					>
						<Trash2 className="size-3.5" />
					</Button>
				</CardFooter>
			</Card>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Projekt löschen?</AlertDialogTitle>
						<AlertDialogDescription>
							„{project.title}" wird dauerhaft aus dem Vault gelöscht.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Abbrechen</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleting ? "Löschen…" : "Löschen"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
