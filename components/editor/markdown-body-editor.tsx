"use client";

import * as React from "react";
import { Code, PenLine } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NovelEditor } from "@/components/editor/novel-editor";
import { AutoHeightTextarea } from "@/components/editor/auto-height-textarea";
import { cn } from "@/lib/utils";

export type MarkdownViewMode = "visual" | "raw";

export interface MarkdownBodyEditorProps {
	value: string;
	onChange: (value: string) => void;
	editable?: boolean;
	editorKey?: string;
	className?: string;
	contentClassName?: string;
	/** Full-document raw mode (vault). When omitted, raw edits `value` only. */
	rawDocument?: {
		value: string;
		onChange: (value: string) => void;
	};
	viewMode?: MarkdownViewMode;
	defaultViewMode?: MarkdownViewMode;
	onViewModeChange?: (mode: MarkdownViewMode) => void;
	showModeToggle?: boolean;
	rawPlaceholder?: string;
}

export function MarkdownBodyEditor({
	value,
	onChange,
	editable = true,
	editorKey,
	className,
	contentClassName,
	rawDocument,
	viewMode: controlledViewMode,
	defaultViewMode = "visual",
	onViewModeChange,
	showModeToggle = true,
	rawPlaceholder = "Markdown…",
}: MarkdownBodyEditorProps) {
	const [internalViewMode, setInternalViewMode] =
		React.useState<MarkdownViewMode>(defaultViewMode);
	const viewMode = controlledViewMode ?? internalViewMode;

	const setViewMode = React.useCallback(
		(mode: MarkdownViewMode) => {
			if (controlledViewMode === undefined) {
				setInternalViewMode(mode);
			}
			onViewModeChange?.(mode);
		},
		[controlledViewMode, onViewModeChange],
	);

	const handleViewModeChange = (next: string) => {
		if (next !== "visual" && next !== "raw") return;
		setViewMode(next);
	};

	const rawValue = rawDocument?.value ?? value;
	const handleRawChange = rawDocument?.onChange ?? onChange;

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{showModeToggle && (
				<ToggleGroup
					type="single"
					value={viewMode}
					onValueChange={handleViewModeChange}
					variant="outline"
					size="sm"
					className="w-fit"
				>
					<ToggleGroupItem value="visual" aria-label="Editor">
						<PenLine className="mr-1 size-4" />
						Editor
					</ToggleGroupItem>
					<ToggleGroupItem value="raw" aria-label="Raw">
						<Code className="mr-1 size-4" />
						Raw
					</ToggleGroupItem>
				</ToggleGroup>
			)}

			<div className={cn("[overflow-anchor:none]", contentClassName)}>
				{viewMode === "raw" ? (
					<AutoHeightTextarea
						key={editorKey ? `${editorKey}-raw` : "raw"}
						value={rawValue}
						name="MarkdownRaw"
						onValueChange={handleRawChange}
						readOnly={!editable}
						spellCheck={false}
						className="min-h-[14rem] font-mono text-sm leading-relaxed border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-80"
						placeholder={rawPlaceholder}
					/>
				) : (
					<NovelEditor
						key={editorKey ? `${editorKey}-visual` : "visual"}
						initialContent={value}
						onChange={onChange}
						editable={editable}
						className="min-h-[14rem] p-0"
					/>
				)}
			</div>
		</div>
	);
}
