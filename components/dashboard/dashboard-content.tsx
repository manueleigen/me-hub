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
import { Badge } from "@/components/ui/badge";
import {
	Clock,
	FileText,
	FolderOpen,
	Lightbulb,
	Plus,
	TrendingUp,
	ArrowRight,
} from "lucide-react";

// Mock data for the dashboard
const stats = [
	{
		title: "Stunden diese Woche",
		value: "32.5",
		change: "+12%",
		changeType: "positive" as const,
		icon: Clock,
	},
	{
		title: "Vault Dateien",
		value: "47",
		change: "+3",
		changeType: "neutral" as const,
		icon: FileText,
	},
	{
		title: "Aktive Projekte",
		value: "4",
		change: "2 faellig",
		changeType: "warning" as const,
		icon: FolderOpen,
	},
	{
		title: "Produkt-Ideen",
		value: "12",
		change: "3 neu",
		changeType: "positive" as const,
		icon: Lightbulb,
	},
];

const recentFiles = [
	{
		name: "MeHub",
		path: "projekte/personal-hub",
		type: "Projekt",
		updated: "vor 2 Stunden",
	},
	{
		name: "Client Projekt Alpha",
		path: "projekte/client-projekt-alpha",
		type: "Projekt",
		updated: "vor 5 Stunden",
	},
	{
		name: "15. Februar 2024",
		path: "notizen/daily/2024-02-15",
		type: "Daily Note",
		updated: "Heute",
	},
	{
		name: "SaaS Konzepte",
		path: "notizen/ideen/saas-konzepte",
		type: "Notiz",
		updated: "Gestern",
	},
];

const quickActions = [
	{
		title: "Neue Zeiterfassung",
		description: "Arbeitszeit eintragen",
		href: "/zeiterfassung",
		icon: Clock,
	},
	{
		title: "Neue Notiz",
		description: "Daily Note erstellen",
		href: "/vault/notizen/daily",
		icon: FileText,
	},
	{
		title: "Neue Idee",
		description: "Produkt-Idee festhalten",
		href: "/produkt-ideen",
		icon: Lightbulb,
	},
];

export function DashboardContent() {
	return (
		<div className="p-6 space-y-6">
			{/* Welcome Section */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Willkommen zurueck
				</h1>
				<p className="text-muted-foreground">
					Hier ist eine Uebersicht deiner Aktivitaeten und Projekte.
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{stat.title}
							</CardTitle>
							<stat.icon className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							<p
								className={`text-xs ${
									stat.changeType === "positive"
										? "text-green-600 dark:text-green-400"
										: stat.changeType === "warning"
											? "text-yellow-600 dark:text-yellow-400"
											: "text-muted-foreground"
								}`}
							>
								{stat.changeType === "positive" && (
									<TrendingUp className="inline size-3 mr-1" />
								)}
								{stat.change}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
				{/* Recent Files */}
				<Card className="lg:col-span-4">
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Zuletzt bearbeitet</CardTitle>
							<CardDescription>Deine neuesten Vault-Dateien</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/vault">
								Alle anzeigen
								<ArrowRight className="ml-1 size-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentFiles.map((file) => (
								<Link
									key={file.path}
									href={`/vault/${file.path}`}
									className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-center gap-3">
										<div className="flex size-9 items-center justify-center rounded-lg bg-muted">
											<FileText className="size-4" />
										</div>
										<div>
											<p className="font-medium text-sm">{file.name}</p>
											<p className="text-xs text-muted-foreground">
												{file.type}
											</p>
										</div>
									</div>
									<Badge variant="secondary" className="text-xs">
										{file.updated}
									</Badge>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle>Schnellaktionen</CardTitle>
						<CardDescription>Haeufig verwendete Aktionen</CardDescription>
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

			{/* Activity / Time Overview */}
			<Card>
				<CardHeader>
					<CardTitle>Wochenueberblick</CardTitle>
					<CardDescription>
						Deine Aktivitaeten der letzten 7 Tage
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-end gap-2 h-32">
						{["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day, index) => {
							const heights = [60, 80, 45, 90, 70, 20, 10];
							return (
								<div
									key={day}
									className="flex-1 flex flex-col items-center gap-2"
								>
									<div
										className="w-full bg-primary/20 rounded-t transition-all hover:bg-primary/30"
										style={{ height: `${heights[index]}%` }}
									/>
									<span className="text-xs text-muted-foreground">{day}</span>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
