"use client"

import { Bold, Italic, Underline, Strikethrough, Code } from "lucide-react"
import { EditorBubbleItem, useEditor } from "novel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SelectorItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  command: (editor: ReturnType<typeof useEditor>["editor"]) => void
  isActive: (editor: ReturnType<typeof useEditor>["editor"]) => boolean
}

const items: SelectorItem[] = [
  {
    name: "bold",
    icon: Bold,
    command: (editor) => editor?.chain().focus().toggleBold().run(),
    isActive: (editor) => editor?.isActive("bold") ?? false,
  },
  {
    name: "italic",
    icon: Italic,
    command: (editor) => editor?.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor?.isActive("italic") ?? false,
  },
  {
    name: "underline",
    icon: Underline,
    command: (editor) => editor?.chain().focus().toggleUnderline().run(),
    isActive: (editor) => editor?.isActive("underline") ?? false,
  },
  {
    name: "strike",
    icon: Strikethrough,
    command: (editor) => editor?.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor?.isActive("strike") ?? false,
  },
  {
    name: "code",
    icon: Code,
    command: (editor) => editor?.chain().focus().toggleCode().run(),
    isActive: (editor) => editor?.isActive("code") ?? false,
  },
]

export function TextButtons() {
  const { editor } = useEditor()

  if (!editor) return null

  return (
    <div className="flex">
      {items.map((item) => (
        <EditorBubbleItem
          key={item.name}
          onSelect={(editor) => {
            item.command(editor)
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            className={cn(item.isActive(editor) && "bg-accent")}
          >
            <item.icon className="size-4" />
          </Button>
        </EditorBubbleItem>
      ))}
    </div>
  )
}
