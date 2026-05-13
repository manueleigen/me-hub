"use client";

import * as React from "react";
import { Edit, Eye, Save, X, Clock, Tag, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VaultFile } from "@/types/vault";
import { MarkdownContent } from "./markdown-content";
import { saveVaultFile } from "@/app/actions/vault";
import { useSync } from "@/lib/vault/sync-context";
import { useSettings } from "@/lib/settings-context";

const AUTOSAVE_DELAY = 2000;

interface VaultViewerProps {
	file: VaultFile;
}

export function VaultViewer({ file }: VaultViewerProps) {
	const { startSync, endSync } = useSync();
	const { settings } = useSettings();
	const [, startTransition] = React.useTransition();
	const [isEditing, setIsEditing] = React.useState(false);
	const [content, setContent] = React.useState(file.content || "");
	const savedContentRef = React.useRef(file.content || "");

	// Auto-save: fires 2s after typing stops (only while editing and autoSave is enabled)
	React.useEffect(() => {
		if (!isEditing) return;
		if (!settings.autoSave) return;
		if (content === savedContentRef.current) return;

		const t = setTimeout(() => {
			startSync();
			startTransition(async () => {
				try {
					await saveVaultFile(file.path, content);
					savedContentRef.current = content;
				} catch {
					// silent fail on auto-save
				} finally {
					endSync();
				}
			});
		}, AUTOSAVE_DELAY);

		return () => clearTimeout(t);
	}, [content, isEditing, file.path, startSync, endSync]);

	const handleSave = () => {
		// Immediately exit edit mode — content already shows correctly from local state
		setIsEditing(false);
		savedContentRef.current = content;
		startSync();
		startTransition(async () => {
			try {
				await saveVaultFile(file.path, content);
			} catch {
				// Revert: re-open edit mode so user can retry
				setIsEditing(true);
				toast.error("Speichern fehlgeschlagen – bitte erneut versuchen");
			} finally {
				endSync();
			}
		});
	};

	const handleCancel = () => {
		setContent(savedContentRef.current);
		setIsEditing(false);
	};

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div>
					<h1 className="text-xl font-semibold">{file.title}</h1>
					{file.frontmatter?.description && (
						<p className="text-sm text-muted-foreground mt-1">
							{file.frontmatter.description}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					{isEditing ? (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCancel}
							>
								<X className="size-4 mr-1" />
								Abbrechen
							</Button>
							<Button size="sm" onClick={handleSave}>
								<Save className="size-4 mr-1" />
								Speichern
							</Button>
						</>
					) : (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsEditing(true)}
						>
							<Edit className="size-4 mr-1" />
							Bearbeiten
						</Button>
					)}
				</div>
			</div>

			{/* Frontmatter */}
			{file.frontmatter && Object.keys(file.frontmatter).length > 0 && (
				<div className="px-4 py-3 border-b bg-muted/30">
					<div className="flex flex-wrap items-center gap-4 text-sm">
						{file.frontmatter.status && (
							<div className="flex items-center gap-1.5">
								<Eye className="size-3.5 text-muted-foreground" />
								<Badge variant="secondary">{file.frontmatter.status}</Badge>
							</div>
						)}
						{file.frontmatter.date && (
							<div className="flex items-center gap-1.5 text-muted-foreground">
								<Clock className="size-3.5" />
								<span>{file.frontmatter.date}</span>
							</div>
						)}
						{file.frontmatter.client && (
							<div className="flex items-center gap-1.5 text-muted-foreground">
								<User className="size-3.5" />
								<span>{file.frontmatter.client}</span>
							</div>
						)}
						{file.frontmatter.tags && file.frontmatter.tags.length > 0 && (
							<div className="flex items-center gap-1.5">
								<Tag className="size-3.5 text-muted-foreground" />
								<div className="flex gap-1">
									{file.frontmatter.tags.map((tag) => (
										<Badge key={tag} variant="outline" className="text-xs">
											{tag}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Content */}
			<ScrollArea className="flex-1">
				<div className="p-6 max-w-4xl">
					{isEditing ? (
						<textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="w-full min-h-[500px] p-4 font-mono text-sm bg-muted/50 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
							placeholder="Markdown eingeben…"
						/>
					) : (
						<MarkdownContent content={content} />
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
