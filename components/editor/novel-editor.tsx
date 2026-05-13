"use client"

import * as React from "react"
import {
  EditorRoot,
  EditorContent,
  type JSONContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
} from "novel"
import { handleCommandNavigation, ImageResizer } from "novel"
import { defaultExtensions } from "./extensions"
import { slashCommand, suggestionItems } from "./slash-command"
import { NodeSelector } from "./selectors/node-selector"
import { LinkSelector } from "./selectors/link-selector"
import { TextButtons } from "./selectors/text-buttons"
import { Separator } from "@/components/ui/separator"

interface NovelEditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  editable?: boolean
}

export function NovelEditor({ initialContent, onChange, editable = true }: NovelEditorProps) {
  const [openNode, setOpenNode] = React.useState(false)
  const [openLink, setOpenLink] = React.useState(false)

  // Convert markdown to JSONContent or use default
  const initialValue: JSONContent = React.useMemo(() => {
    if (!initialContent) {
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [],
          },
        ],
      }
    }

    // Simple markdown to JSONContent conversion
    // For a full implementation, you'd use a proper markdown parser
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: initialContent,
            },
          ],
        },
      ],
    }
  }, [initialContent])

  const extensions = [...defaultExtensions, slashCommand]

  return (
    <EditorRoot>
      <EditorContent
        initialContent={initialValue}
        extensions={extensions}
        editable={editable}
        className="relative min-h-[500px] w-full border-none bg-transparent"
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          attributes: {
            class:
              "prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-p:text-foreground prose-a:text-primary focus:outline-none max-w-none",
          },
        }}
        onUpdate={({ editor }) => {
          if (onChange) {
            // Get content as text for now
            onChange(editor.getText())
          }
        }}
        slotAfter={<ImageResizer />}
      >
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
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>

        <EditorBubble
          tippyOptions={{
            placement: "top",
          }}
          className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-border bg-popover shadow-xl"
        >
          <Separator orientation="vertical" />
          <NodeSelector open={openNode} onOpenChange={setOpenNode} />
          <Separator orientation="vertical" />
          <LinkSelector open={openLink} onOpenChange={setOpenLink} />
          <Separator orientation="vertical" />
          <TextButtons />
        </EditorBubble>
      </EditorContent>
    </EditorRoot>
  )
}
