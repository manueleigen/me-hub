"use client"

import { useState } from "react"
import { Pencil, Trash2, Check, X, Coffee, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { TimeSegment }  from "@/types/zeiterfassung"


interface SessionSegmentsProps {
  segments: TimeSegment[]
  totalWorkMinutes: number
  goalHours: number
  onUpdateSegment: (id: string, updates: Partial<TimeSegment>) => void
  onDeleteSegment: (id: string) => void
  compact?: boolean
}

export function SessionSegments({
  segments,
  totalWorkMinutes,
  goalHours,
  onUpdateSegment,
  onDeleteSegment,
  compact = false,
}: SessionSegmentsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStart, setEditStart] = useState("")
  const [editEnd, setEditEnd] = useState("")

  const goalMinutes = goalHours * 60
  const hours = Math.floor(totalWorkMinutes / 60)
  const minutes = totalWorkMinutes % 60

  const startEdit = (segment: TimeSegment) => {
    setEditingId(segment.id)
    setEditStart(segment.startTime)
    setEditEnd(segment.endTime || "")
  }

  const saveEdit = (id: string) => {
    onUpdateSegment(id, { startTime: editStart, endTime: editEnd || null })
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditStart("")
    setEditEnd("")
  }

  if (segments.length === 0) {
    return (
      <div
        className={cn(
          "text-center text-muted-foreground",
          compact ? "py-4 text-sm" : "py-8",
        )}
      >
        <p>Noch keine Zeiteintraege in dieser Session.</p>
        {!compact && (
          <p className="text-sm mt-1">Druecke Start, um zu beginnen.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Session Zeiten</span>
        <span className="font-medium">
          {hours}:{minutes.toString().padStart(2, "0")} / {goalHours}:00
        </span>
      </div>

      <div
        className={cn(
          "space-y-2 overflow-y-auto pr-2",
          compact ? "max-h-32" : "max-h-48",
        )}
      >
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg border transition-colors",
              segment.type === "work" 
                ? "bg-green-500/5 border-green-500/20" 
                : "bg-yellow-500/5 border-yellow-500/20"
            )}
          >
            <div className={cn(
              "p-1.5 rounded",
              segment.type === "work" ? "bg-green-500/10" : "bg-yellow-500/10"
            )}>
              {segment.type === "work" 
                ? <Briefcase className="size-4 text-green-500" />
                : <Coffee className="size-4 text-yellow-500" />
              }
            </div>

            {editingId === segment.id ? (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-24 h-8 text-sm"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="w-24 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => saveEdit(segment.id)}
                    className="size-7 p-0 text-green-500 hover:text-green-600"
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                    className="size-7 p-0"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span className="font-mono text-sm">
                    {segment.startTime} - {segment.endTime || "..."}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    {segment.type === "work" ? "Arbeit" : "Pause"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(segment)}
                    className="size-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteSegment(segment.id)}
                    className="size-7 p-0 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
