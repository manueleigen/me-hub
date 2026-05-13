"use client"

import { Check, ChevronDown } from "lucide-react"
import { EditorBubbleItem, useEditor } from "novel"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SelectorItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  command: (editor: ReturnType<typeof useEditor>["editor"]) => void
  isActive: (editor: ReturnType<typeof useEditor>["editor"]) => boolean
}

const items: SelectorItem[] = [
  {
    name: "Text",
    icon: ({ className }) => <span className={className}>T</span>,
    command: (editor) => editor?.chain().focus().clearNodes().run(),
    isActive: (editor) =>
      (editor?.isActive("paragraph") &&
        !editor?.isActive("bulletList") &&
        !editor?.isActive("orderedList")) ??
      false,
  },
  {
    name: "Heading 1",
    icon: ({ className }) => <span className={className}>H1</span>,
    command: (editor) =>
      editor?.chain().focus().clearNodes().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor?.isActive("heading", { level: 1 }) ?? false,
  },
  {
    name: "Heading 2",
    icon: ({ className }) => <span className={className}>H2</span>,
    command: (editor) =>
      editor?.chain().focus().clearNodes().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor?.isActive("heading", { level: 2 }) ?? false,
  },
  {
    name: "Heading 3",
    icon: ({ className }) => <span className={className}>H3</span>,
    command: (editor) =>
      editor?.chain().focus().clearNodes().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor?.isActive("heading", { level: 3 }) ?? false,
  },
  {
    name: "Bullet List",
    icon: ({ className }) => <span className={className}>UL</span>,
    command: (editor) => editor?.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor?.isActive("bulletList") ?? false,
  },
  {
    name: "Numbered List",
    icon: ({ className }) => <span className={className}>OL</span>,
    command: (editor) => editor?.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor?.isActive("orderedList") ?? false,
  },
  {
    name: "Quote",
    icon: ({ className }) => <span className={className}>{">"}</span>,
    command: (editor) => editor?.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor?.isActive("blockquote") ?? false,
  },
  {
    name: "Code",
    icon: ({ className }) => <span className={className}>{"<>"}</span>,
    command: (editor) => editor?.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor?.isActive("codeBlock") ?? false,
  },
]

interface NodeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NodeSelector({ open, onOpenChange }: NodeSelectorProps) {
  const { editor } = useEditor()
  if (!editor) return null

  const activeItem = items.filter((item) => item.isActive(editor)).pop() ?? {
    name: "Multiple",
  }

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild className="hover:bg-accent gap-2">
        <Button size="sm" variant="ghost">
          <span className="whitespace-nowrap text-sm">{activeItem.name}</span>
          <ChevronDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={5}
        align="start"
        className="w-48 p-1"
      >
        {items.map((item) => (
          <EditorBubbleItem
            key={item.name}
            onSelect={(editor) => {
              item.command(editor)
              onOpenChange(false)
            }}
            className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <item.icon className="size-4" />
              <span>{item.name}</span>
            </div>
            {activeItem.name === item.name && <Check className="size-4" />}
          </EditorBubbleItem>
        ))}
      </PopoverContent>
    </Popover>
  )
}
