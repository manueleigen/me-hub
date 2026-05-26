"use client";

import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Clock,
	FileText,
	FolderOpen,
	Lightbulb,
	Plus,
	ArrowRight,
} from "lucide-react";
import {
	ideasListPath,
	projectsListPath,
	vaultListPath,
	zeiterfassungPath,
} from "@/lib/workspace-paths";

type DashboardContentProps = {
	workspaceSlug: string;
};

export function DashboardContent({ workspaceSlug }: DashboardContentProps) {
	const quickActions = [
		{
			title: "Neue Zeiterfassung",
			description: "Arbeitszeit eintragen",
			href: zeiterfassungPath(workspaceSlug),
			icon: Clock,
		},
		{
			title: "Vault öffnen",
			description: "Notizen und Dateien durchsuchen",
			href: vaultListPath(workspaceSlug),
			icon: FileText,
		},
		{
			title: "Neue Idee",
			description: "Produkt-Idee festhalten",
			href: ideasListPath(workspaceSlug),
			icon: Lightbulb,
		},
	];

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Willkommen zurueck
				</h1>
				<p className="text-muted-foreground">
					Hier ist eine Uebersicht deiner Aktivitaeten und Projekte.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Zeiterfassung
						</CardTitle>
						<Clock className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Button variant="link" className="h-auto p-0" asChild>
							<Link href={zeiterfassungPath(workspaceSlug)}>Zum Tracker</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Vault</CardTitle>
						<FileText className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Button variant="link" className="h-auto p-0" asChild>
							<Link href={vaultListPath(workspaceSlug)}>Dateien anzeigen</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Projekte</CardTitle>
						<FolderOpen className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Button variant="link" className="h-auto p-0" asChild>
							<Link href={projectsListPath(workspaceSlug)}>Portfolio öffnen</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Produkt-Ideen
						</CardTitle>
						<Lightbulb className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Button variant="link" className="h-auto p-0" asChild>
							<Link href={ideasListPath(workspaceSlug)}>Ideen verwalten</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Schnellaktionen</CardTitle>
						<CardDescription>Haeufig verwendete Aktionen</CardDescription>
					</div>
					<Button variant="ghost" size="sm" asChild>
						<Link href={vaultListPath(workspaceSlug)}>
							Vault
							<ArrowRight className="ml-1 size-4" />
						</Link>
					</Button>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{quickActions.map((action) => (
							<Link
								key={action.href}
								href={action.href}
								className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
							>
								<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
									<action.icon className="size-4 text-primary" />
								</div>
								<div className="flex-1">
									<p className="font-medium text-sm">{action.title}</p>
									<p className="text-xs text-muted-foreground">
										{action.description}
									</p>
								</div>
								<Plus className="size-4 text-muted-foreground" />
							</Link>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
