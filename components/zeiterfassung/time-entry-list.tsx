"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Clock, MoreVertical, Pencil, Trash2 } from "lucide-react"
import type { TimeEntry } from "@/types/zeiterfassung"
import { getProjectById, deleteTimeEntry } from "@/lib/mock-data/zeiterfassung"

interface TimeEntryListProps {
  entries: TimeEntry[]
  onUpdate?: () => void
  showDate?: boolean
}

export function TimeEntryList({ entries, onUpdate, showDate = false }: TimeEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="size-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Keine Eintraege fuer diesen Zeitraum.</p>
      </div>
    )
  }

  const handleDelete = (id: string) => {
    if (confirm("Eintrag wirklich loeschen?")) {
      deleteTimeEntry(id)
      onUpdate?.()
    }
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => {
        const project = getProjectById(entry.project)
        return (
          <Card key={entry.id} className="group">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{entry.task}</span>
                  {entry.billable && (
                    <Badge variant="secondary" className="shrink-0">
                      {entry.rate} EUR/h
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{project?.name || entry.project}</span>
                  {showDate && (
                    <>
                      <span>-</span>
                      <span>{formatDate(entry.date)}</span>
                    </>
                  )}
                  {entry.description && (
                    <>
                      <span>-</span>
                      <span className="truncate">{entry.description}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">{entry.hours}h</div>
                  {entry.billable && (
                    <div className="text-xs text-muted-foreground">
                      {(entry.hours * entry.rate).toFixed(0)} EUR
                    </div>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pencil className="mr-2 size-4" />
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Loeschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}
