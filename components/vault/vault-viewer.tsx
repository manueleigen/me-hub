"use client";

import * as React from "react";
import { Eye, Clock, Tag, User, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VaultFile, VaultFrontmatter } from "@/types/vault";
import { isVaultMarkdownDisplayPath } from "@/lib/vault/mirrorable-text-files";
import {
	composeVaultFileContent,
	parseVaultFileContent,
} from "@/lib/vault/file-content";
import { parseFrontmatter } from "@/lib/frontmatter";
import { AutoHeightTextarea } from "@/components/editor/auto-height-textarea";
import {
	MarkdownBodyEditor,
	type MarkdownViewMode,
} from "@/components/editor/markdown-body-editor";
import { saveVaultFile } from "@/app/actions/vault";
import {
	useVaultEditorGuard,
	type VaultEditorSaveOptions,
} from "@/lib/vault/editor-guard-context";
import { useSync } from "@/lib/vault/sync-context";
import { useSettings } from "@/lib/settings-context";
import { useVaultWriteEnabled } from "@/lib/vault-link-context";
import { cn } from "@/lib/utils";

const AUTOSAVE_DELAY = 2000;

interface VaultViewerProps {
	file: VaultFile;
}

export function VaultViewer({ file }: VaultViewerProps) {
	const vaultWriteEnabled = useVaultWriteEnabled();
	const { startSync, endSync } = useSync();
	const { registerEditor } = useVaultEditorGuard();
	const { settings } = useSettings();
	const [, startTransition] = React.useTransition();
	const autosaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const userEditedRef = React.useRef(false);
	const ignoreChangesRef = React.useRef(false);

	const parsed = React.useMemo(() => parseVaultFileContent(file), [file]);
	const [body, setBody] = React.useState(parsed.body);
	const [frontmatter, setFrontmatter] = React.useState<VaultFrontmatter>(
		parsed.frontmatter,
	);
	const [rawContent, setRawContent] = React.useState(
		composeVaultFileContent(parsed.frontmatter, parsed.body),
	);
	const [viewMode, setViewMode] = React.useState<MarkdownViewMode>("visual");
	const savedContentRef = React.useRef(
		composeVaultFileContent(parsed.frontmatter, parsed.body),
	);

	React.useEffect(() => {
		const next = parseVaultFileContent(file);
		const composed = composeVaultFileContent(next.frontmatter, next.body);
		userEditedRef.current = false;
		ignoreChangesRef.current = true;
		setBody(next.body);
		setFrontmatter(next.frontmatter);
		setRawContent(composed);
		setViewMode("visual");
		savedContentRef.current = composed;

		const frame = requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				ignoreChangesRef.current = false;
			});
		});
		return () => cancelAnimationFrame(frame);
	}, [file.path, file.content, file.frontmatter]);

	const markUserEdited = React.useCallback(() => {
		if (ignoreChangesRef.current) return;
		userEditedRef.current = true;
	}, []);

	const handleBodyChange = React.useCallback(
		(value: string) => {
			markUserEdited();
			setBody(value);
		},
		[markUserEdited],
	);

	const handleRawContentChange = React.useCallback(
		(value: string) => {
			markUserEdited();
			setRawContent(value);
		},
		[markUserEdited],
	);

	const useNovelEditor = isVaultMarkdownDisplayPath(file.path);

	const visualContent = React.useMemo(
		() => composeVaultFileContent(frontmatter, body),
		[frontmatter, body],
	);

	const activeContent = viewMode === "raw" ? rawContent : visualContent;
	const isDirty =
		userEditedRef.current && activeContent !== savedContentRef.current;

	const isContentDirty = React.useCallback(() => {
		if (!userEditedRef.current) return false;
		const mode = viewModeRef.current;
		const content =
			mode === "raw" ? rawContentRef.current : visualContentRef.current;
		return content !== savedContentRef.current;
	}, []);

	const viewModeRef = React.useRef(viewMode);
	const rawContentRef = React.useRef(rawContent);
	const visualContentRef = React.useRef(visualContent);
	viewModeRef.current = viewMode;
	rawContentRef.current = rawContent;
	visualContentRef.current = visualContent;

	const clearAutosaveTimer = React.useCallback(() => {
		if (autosaveTimerRef.current) {
			clearTimeout(autosaveTimerRef.current);
			autosaveTimerRef.current = null;
		}
	}, []);

	const persistContent = React.useCallback(
		async (content: string, options?: VaultEditorSaveOptions) => {
			if (!vaultWriteEnabled) return true;
			startSync();
			try {
				await saveVaultFile(file.path, content);

				if (options?.background) {
					return true;
				}

				savedContentRef.current = content;
				userEditedRef.current = false;
				const next = parseFrontmatter(content);
				setFrontmatter(next.data as VaultFrontmatter);
				setBody(next.content);
				setRawContent(content);
				return true;
			} catch {
				if (options?.showToast) {
					toast.error("Speichern fehlgeschlagen – bitte erneut versuchen");
				}
				return false;
			} finally {
				endSync();
			}
		},
		[file.path, vaultWriteEnabled, startSync, endSync],
	);

	React.useEffect(() => {
		if (!vaultWriteEnabled) return;
		if (!settings.autoSave) return;
		if (viewMode !== "visual") return;
		if (!userEditedRef.current) return;
		if (visualContent === savedContentRef.current) return;

		clearAutosaveTimer();
		autosaveTimerRef.current = setTimeout(() => {
			startTransition(async () => {
				await persistContent(visualContentRef.current);
			});
		}, AUTOSAVE_DELAY);

		return clearAutosaveTimer;
	}, [
		body,
		visualContent,
		file.path,
		settings.autoSave,
		vaultWriteEnabled,
		viewMode,
		persistContent,
		clearAutosaveTimer,
	]);

	React.useEffect(() => {
		if (!vaultWriteEnabled) {
			registerEditor(null);
			return;
		}

		registerEditor({
			isDirty: isContentDirty,
			captureContent: () => {
				if (!isContentDirty()) return null;
				const mode = viewModeRef.current;
				return mode === "raw" ? rawContentRef.current : visualContentRef.current;
			},
			saveContent: (content, options) => {
				clearAutosaveTimer();
				return persistContent(content, options);
			},
		});

		return () => registerEditor(null);
	}, [
		vaultWriteEnabled,
		file.path,
		registerEditor,
		persistContent,
		clearAutosaveTimer,
		isContentDirty,
	]);

	React.useEffect(() => {
		if (!vaultWriteEnabled) return;
		const handler = (event: BeforeUnloadEvent) => {
			if (!isContentDirty()) return;
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [vaultWriteEnabled, file.path, isContentDirty]);

	const handleSave = (content: string) => {
		clearAutosaveTimer();
		startTransition(async () => {
			await persistContent(content, { showToast: true });
		});
	};

	const handleViewModeChange = (next: MarkdownViewMode) => {
		if (next === "raw") {
			setRawContent(visualContent);
			setViewMode("raw");
			return;
		}

		const parsedRaw = parseFrontmatter(rawContent);
		setFrontmatter(parsedRaw.data as VaultFrontmatter);
		setBody(parsedRaw.content);
		setViewMode("visual");
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between gap-4 p-4 w-full max-w-[900px] mx-auto">
				<div className="min-w-0">
					<h1 className="text-xl font-semibold">{file.title}</h1>
					{frontmatter.description && viewMode === "visual" && (
						<p className="text-sm text-muted-foreground mt-1">
							{String(frontmatter.description)}
						</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{viewMode === "raw" && vaultWriteEnabled && (
						<Button
							size="sm"
							onClick={() => handleSave(rawContent)}
							disabled={!isDirty}
						>
							<Save className="size-4 mr-1" />
							Speichern
						</Button>
					)}
					{viewMode === "visual" &&
						!settings.autoSave &&
						vaultWriteEnabled &&
						isDirty && (
							<Button size="sm" onClick={() => handleSave(visualContent)}>
								<Save className="size-4 mr-1" />
								Speichern
							</Button>
						)}
				</div>
			</div>
			<hr />

			{viewMode === "visual" && Object.keys(frontmatter).length > 0 && (
				<div className="px-4 py-3 border-b bg-muted/30">
					<div className="flex flex-wrap items-center gap-4 text-sm">
						{frontmatter.status && (
							<div className="flex items-center gap-1.5">
								<Eye className="size-3.5 text-muted-foreground" />
								<Badge variant="secondary">{String(frontmatter.status)}</Badge>
							</div>
						)}
						{frontmatter.date && (
							<div className="flex items-center gap-1.5 text-muted-foreground">
								<Clock className="size-3.5" />
								<span>{String(frontmatter.date)}</span>
							</div>
						)}
						{frontmatter.client && (
							<div className="flex items-center gap-1.5 text-muted-foreground">
								<User className="size-3.5" />
								<span>{String(frontmatter.client)}</span>
							</div>
						)}
						{Array.isArray(frontmatter.tags) && frontmatter.tags.length > 0 && (
							<div className="flex items-center gap-1.5">
								<Tag className="size-3.5 text-muted-foreground" />
								<div className="flex gap-1">
									{frontmatter.tags.map((tag) => (
										<Badge
											key={String(tag)}
											variant="outline"
											className="text-xs"
										>
											{String(tag)}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			<ScrollArea className="flex-1">
				<div className="p-4 max-w-[900px] mx-auto [overflow-anchor:none]">
					{useNovelEditor ? (
						<MarkdownBodyEditor
							editorKey={file.path}
							value={body}
							onChange={handleBodyChange}
							editable={vaultWriteEnabled}
							viewMode={viewMode}
							onViewModeChange={handleViewModeChange}
							rawDocument={{
								value: rawContent,
								onChange: handleRawContentChange,
							}}
							rawPlaceholder="Markdown-Quelltext…"
							contentClassName="min-h-[12rem]"
						/>
					) : (
						<AutoHeightTextarea
							key={file.path}
							name="Document"
							value={body}
							onValueChange={handleBodyChange}
							readOnly={!vaultWriteEnabled}
							className="min-h-[12rem] font-mono text-sm bg-muted/50 rounded-lg border p-4 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-default disabled:opacity-80"
							placeholder="Text eingeben…"
						/>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
