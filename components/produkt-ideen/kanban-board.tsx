"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowRight, GripVertical, MoreVertical, Pencil, Trash2, Eye } from "lucide-react"
import type { ProductIdea, IdeaStatus } from "@/types/produkt-ideen"
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/produkt-ideen"
import { IdeaDetailDialog } from "./idea-detail-dialog"
import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  ideas: ProductIdea[]
  onStatusChange: (idea: ProductIdea, newStatus: IdeaStatus) => Promise<void>
  onEdit: (idea: ProductIdea) => void
  onDelete: (idea: ProductIdea) => void
}

const COLUMNS: IdeaStatus[] = ["idea", "validating", "building", "launched", "parked"]

export function KanbanBoard({ ideas, onStatusChange, onEdit, onDelete }: KanbanBoardProps) {
  const [selectedIdea, setSelectedIdea] = useState<ProductIdea | null>(null)
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null)
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, slug: string) => {
    setDraggedSlug(slug)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: IdeaStatus) => {
    e.preventDefault()
    if (!draggedSlug) return
    const idea = ideas.find((i) => i.slug === draggedSlug)
    setDraggedSlug(null)
    if (!idea || idea.status === targetStatus) return
    setUpdatingSlug(idea.slug)
    try {
      await onStatusChange(idea, targetStatus)
    } finally {
      setUpdatingSlug(null)
    }
  }

  const moveToStatus = async (idea: ProductIdea, status: IdeaStatus) => {
    setUpdatingSlug(idea.slug)
    try {
      await onStatusChange(idea, status)
    } finally {
      setUpdatingSlug(null)
    }
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => {
          const columnIdeas = ideas.filter((idea) => idea.status === status)
          const config = STATUS_CONFIG[status]

          return (
            <div
              key={status}
              className="flex-shrink-0 w-[300px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("size-2 rounded-full", config.color)} />
                  <h3 className="font-medium text-sm">{config.label}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {columnIdeas.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {columnIdeas.map((idea) => (
                    <Card
                      key={idea.slug}
                      className={cn(
                        "cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md",
                        draggedSlug === idea.slug && "opacity-50",
                        updatingSlug === idea.slug && "opacity-60 pointer-events-none",
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idea.slug)}
                    >
                      <CardHeader className="p-3 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <GripVertical className="size-4 text-muted-foreground shrink-0" />
                            <CardTitle className="text-sm font-medium line-clamp-2">
                              {idea.title}
                            </CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-6 shrink-0">
                                <MoreVertical className="size-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedIdea(idea)}>
                                <Eye className="mr-2 size-4" />
                                Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(idea)}>
                                <Pencil className="mr-2 size-4" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {COLUMNS.filter((s) => s !== status).map((targetStatus) => (
                                <DropdownMenuItem
                                  key={targetStatus}
                                  onClick={() => moveToStatus(idea, targetStatus)}
                                >
                                  <ArrowRight className="mr-2 size-4" />
                                  Nach {STATUS_CONFIG[targetStatus].label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDelete(idea)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        {idea.description && (
                          <CardDescription className="text-xs line-clamp-2 mb-2">
                            {idea.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {idea.category}
                          </Badge>
                          <span className={cn("text-xs font-medium", PRIORITY_CONFIG[idea.priority].color)}>
                            {PRIORITY_CONFIG[idea.priority].label}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {columnIdeas.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Keine Ideen
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <IdeaDetailDialog
        idea={selectedIdea}
        open={!!selectedIdea}
        onOpenChange={(open) => !open && setSelectedIdea(null)}
      />
    </>
  )
}
