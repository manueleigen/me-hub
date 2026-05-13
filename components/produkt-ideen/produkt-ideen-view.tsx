"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard } from "./kanban-board";
import { IdeaDialog } from "./idea-dialog";
import {
	saveProductIdea,
	deleteProductIdea,
	updateIdeaStatus,
} from "@/app/actions/produkt-ideen";
import type {
	ProductIdea,
	ProductIdeaFrontmatter,
	IdeaStatus,
} from "@/types/produkt-ideen";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/produkt-ideen";
import { cn } from "@/lib/utils";

interface ProduktIdeenViewProps {
	ideas: ProductIdea[];
}

type ViewMode = "kanban" | "list";

export function ProduktIdeenView({ ideas }: ProduktIdeenViewProps) {
	const router = useRouter();
	const [view, setView] = useState<ViewMode>("kanban");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<ProductIdea | undefined>();

	const totalIdeas = ideas.length;
	const building = ideas.filter((i) => i.status === "building").length;
	const highPriority = ideas.filter((i) => i.priority === "high").length;
	const launched = ideas.filter((i) => i.status === "launched").length;

	const openCreate = () => {
		setEditTarget(undefined);
		setDialogOpen(true);
	};

	const openEdit = (idea: ProductIdea) => {
		setEditTarget(idea);
		setDialogOpen(true);
	};

	const handleSave = async (
		categorySlug: string,
		slug: string,
		data: ProductIdeaFrontmatter,
		body: string,
		sha?: string,
		oldCategorySlug?: string,
	) => {
		await saveProductIdea(categorySlug, slug, data, body, sha, oldCategorySlug);
		router.refresh();
	};

	const handleDelete = async (idea: ProductIdea) => {
		if (!idea.sha) return;
		if (!confirm("Idee wirklich löschen?")) return;
		await deleteProductIdea(idea.categorySlug, idea.slug, idea.sha);
		router.refresh();
	};

	const handleStatusChange = async (
		idea: ProductIdea,
		newStatus: IdeaStatus,
	) => {
		if (!idea.sha) return;
		await updateIdeaStatus(idea.categorySlug, idea.slug, idea.sha, newStatus);
		router.refresh();
	};

	return (
		<>
			<AppHeader breadcrumbs={[{ label: "Produkt-Ideen" }]} />
			<div className="flex-1 overflow-auto p-6">
				<div className="flex items-start justify-between gap-4 mb-6">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Produkt-Ideen</h1>
						<p className="text-muted-foreground">
							Sammle und entwickle deine Produktideen.
						</p>
					</div>
					<Button onClick={openCreate}>
						<Plus className="mr-2 size-4" />
						Neue Idee
					</Button>
				</div>

				<div className="grid gap-4 md:grid-cols-4 mb-6">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Gesamt
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{totalIdeas}</div>
							<p className="text-xs text-muted-foreground">Produktideen</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								In Entwicklung
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{building}</div>
							<p className="text-xs text-muted-foreground">Aktive Projekte</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Hohe Priorität
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-red-500">
								{highPriority}
							</div>
							<p className="text-xs text-muted-foreground">
								Sollten Fokus bekommen
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Gelauncht
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-500">
								{launched}
							</div>
							<p className="text-xs text-muted-foreground">Live Produkte</p>
						</CardContent>
					</Card>
				</div>

				{totalIdeas === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<Lightbulb className="size-12 text-muted-foreground mb-4" />
						<h3 className="font-semibold text-lg">Keine Ideen</h3>
						<p className="text-muted-foreground text-sm mt-1">
							Halte deine erste Produktidee fest.
						</p>
						<Button className="mt-4" onClick={openCreate}>
							<Plus className="size-4 mr-2" />
							Erste Idee anlegen
						</Button>
					</div>
				) : (
					<Tabs
						value={view}
						onValueChange={(v) => setView(v as ViewMode)}
						className="space-y-4"
					>
						<TabsList>
							<TabsTrigger value="kanban">Kanban</TabsTrigger>
							<TabsTrigger value="list">Liste</TabsTrigger>
						</TabsList>

						<TabsContent value="kanban">
							<KanbanBoard
								ideas={ideas}
								onStatusChange={handleStatusChange}
								onEdit={openEdit}
								onDelete={handleDelete}
							/>
						</TabsContent>

						<TabsContent value="list">
							<Card>
								<CardContent className="p-0">
									<table className="w-full">
										<thead>
											<tr className="border-b">
												<th className="text-left p-4 font-medium">Titel</th>
												<th className="text-left p-4 font-medium">Kategorie</th>
												<th className="text-left p-4 font-medium">Status</th>
												<th className="text-left p-4 font-medium">Priorität</th>
												<th className="text-left p-4 font-medium">Aufwand</th>
											</tr>
										</thead>
										<tbody>
											{ideas.map((idea) => (
												<tr
													key={`${idea.categorySlug}/${idea.slug}`}
													className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
													onClick={() => openEdit(idea)}
												>
													<td className="p-4">
														<div className="font-medium">{idea.title}</div>
														{idea.description && (
															<div className="text-sm text-muted-foreground line-clamp-1">
																{idea.description}
															</div>
														)}
													</td>
													<td className="p-4">
														<Badge variant="outline">{idea.category}</Badge>
													</td>
													<td className="p-4">
														<Badge
															className={cn(
																"text-white",
																STATUS_CONFIG[idea.status]?.color,
															)}
														>
															{STATUS_CONFIG[idea.status]?.label}
														</Badge>
													</td>
													<td className="p-4">
														<span
															className={cn(
																"font-medium",
																PRIORITY_CONFIG[idea.priority]?.color,
															)}
														>
															{PRIORITY_CONFIG[idea.priority]?.label}
														</span>
													</td>
													<td className="p-4 text-muted-foreground">
														{idea.effortEstimate || "–"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				)}
			</div>

			<IdeaDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				idea={editTarget}
				onSave={handleSave}
			/>
		</>
	);
}
