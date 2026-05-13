"use client"

import * as React from "react"
import { Check, Trash, Link } from "lucide-react"
import { useEditor } from "novel"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface LinkSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkSelector({ open, onOpenChange }: LinkSelectorProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { editor } = useEditor()

  // Autofocus on input by default
  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  if (!editor) return null

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={cn("gap-2", editor.isActive("link") && "bg-accent")}
        >
          <Link className="size-4" />
          <p
            className={cn(
              "underline decoration-border underline-offset-4",
              editor.isActive("link") && "text-primary"
            )}
          >
            Link
          </p>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-60 p-0"
        sideOffset={10}
      >
        <form
          onSubmit={(e) => {
            const target = e.currentTarget as HTMLFormElement
            e.preventDefault()
            const input = target[0] as HTMLInputElement
            const url = input.value
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
              onOpenChange(false)
            }
          }}
          className="flex p-1"
        >
          <input
            ref={inputRef}
            type="url"
            placeholder="URL eingeben"
            className="flex-1 bg-background p-1 text-sm outline-none"
            defaultValue={editor.getAttributes("link").href || ""}
          />
          {editor.getAttributes("link").href ? (
            <Button
              size="icon"
              variant="outline"
              type="button"
              className="flex size-8 items-center"
              onClick={() => {
                editor.chain().focus().unsetLink().run()
                onOpenChange(false)
              }}
            >
              <Trash className="size-4" />
            </Button>
          ) : (
            <Button size="icon" className="size-8">
              <Check className="size-4" />
            </Button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  )
}
