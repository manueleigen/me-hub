"use client"

import * as React from "react"
import {
	EditorRoot,
	EditorContent,
	EditorCommand,
	EditorCommandItem,
	EditorCommandEmpty,
	EditorCommandList,
	EditorBubble,
	handleCommandNavigation,
	handleImageDrop,
	handleImagePaste,
	ImageResizer,
} from "novel"
import type { Editor } from "@tiptap/core"
import { defaultExtensions } from "./extensions"
import { slashCommand, suggestionItems } from "./slash-command"
import { NodeSelector } from "./selectors/node-selector"
import { LinkSelector } from "./selectors/link-selector"
import { TextButtons } from "./selectors/text-buttons"
import { uploadFn } from "./image-upload"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import "./novel-editor.css"

interface MarkdownStorage {
	markdown: {
		getMarkdown: () => string
	}
}

function getMarkdownFromEditor(editor: Editor): string {
	const storage = editor.storage as MarkdownStorage
	return storage.markdown?.getMarkdown() ?? editor.getText()
}

interface NovelEditorProps {
	initialContent?: string
	onChange?: (content: string) => void
	editable?: boolean
	className?: string
}

export function NovelEditor({
	initialContent = "",
	onChange,
	editable = true,
	className,
}: NovelEditorProps) {
	const [openNode, setOpenNode] = React.useState(false)
	const [openLink, setOpenLink] = React.useState(false)
	const editorRef = React.useRef<Editor | null>(null)
	const extensions = React.useMemo(
		() => [...defaultExtensions, slashCommand],
		[],
	)

	React.useEffect(() => {
		editorRef.current?.setEditable(editable)
	}, [editable])

	return (
		<div className={cn("novel-editor w-full", className)}>
			<EditorRoot>
				<EditorContent
					extensions={extensions}
					editable={editable}
					immediatelyRender={false}
					className="relative w-full border-none bg-transparent"
					onCreate={({ editor }) => {
						editorRef.current = editor
						editor.commands.setContent(initialContent, false)
						editor.setEditable(editable)
					}}
					onUpdate={({ editor }) => {
						onChange?.(getMarkdownFromEditor(editor))
					}}
					editorProps={{
						handleDOMEvents: {
							keydown: (_view, event) => handleCommandNavigation(event),
						},
						handlePaste: (view, event) =>
							editable
								? handleImagePaste(view, event, uploadFn)
								: false,
						handleDrop: (view, event, _slice, moved) =>
							editable
								? handleImageDrop(view, event, moved, uploadFn)
								: false,
						attributes: {
							class: cn(
								"prose prose-neutral dark:prose-invert max-w-none",
								"prose-headings:font-semibold prose-p:text-foreground prose-a:text-primary",
								"focus:outline-none",
							),
						},
					}}
					slotAfter={editable ? <ImageResizer /> : undefined}
				>
					{editable ? (
						<>
							<EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-border bg-popover px-1 py-2 shadow-md transition-all">
								<EditorCommandEmpty className="px-2 text-muted-foreground">
									Keine Ergebnisse
								</EditorCommandEmpty>
								<EditorCommandList>
									{suggestionItems.map((item) => (
										<EditorCommandItem
											value={item.title}
											onCommand={(val) => item.command?.(val)}
											className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
											key={item.title}
										>
											<div className="flex size-10 items-center justify-center rounded-md border border-border bg-background">
												{item.icon}
											</div>
											<div>
												<p className="font-medium">{item.title}</p>
												<p className="text-xs text-muted-foreground">
													{item.description}
												</p>
											</div>
										</EditorCommandItem>
									))}
								</EditorCommandList>
							</EditorCommand>

							<EditorBubble
								tippyOptions={{ placement: "top" }}
								className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-border bg-popover shadow-xl"
							>
								<Separator orientation="vertical" />
								<NodeSelector open={openNode} onOpenChange={setOpenNode} />
								<Separator orientation="vertical" />
								<LinkSelector open={openLink} onOpenChange={setOpenLink} />
								<Separator orientation="vertical" />
								<TextButtons />
							</EditorBubble>
						</>
					) : null}
				</EditorContent>
			</EditorRoot>
		</div>
	)
}
