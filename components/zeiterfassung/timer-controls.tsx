"use client"

import { Play, Pause, Square, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TimerStatus }  from "@/types/zeiterfassung"

import { cn } from "@/lib/utils"

interface TimerControlsProps {
  status: TimerStatus
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
  hasSegments: boolean
  compact?: boolean
  compactSize?: "default" | "small"
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  hasSegments,
  compact = false,
  compactSize = "default",
}: TimerControlsProps) {
  const small = compact && compactSize === "small"
  const btnSize = compact ? (small ? "sm" : "sm") : "lg"
  const iconClass = small ? "size-3.5" : compact ? "size-4" : "size-5"
  const startPx = small ? "px-3" : compact ? "px-5" : "px-8"
  const actionPx = small ? "px-2.5" : compact ? "px-4" : "px-6"

  return (
    <div className={cn("flex flex-wrap items-center justify-center", small ? "gap-1.5" : compact ? "gap-2" : "gap-3")}>
      {status === "idle" && (
        <Button
          size={btnSize}
          onClick={onStart}
          className={cn(
            "gap-1 transition-all",
            startPx,
            small && "h-7 text-xs",
            !compact && "shadow-lg hover:shadow-green-500/25",
            "bg-green-600 hover:bg-green-700 text-white",
          )}
        >
          <Play className={iconClass} />
          Start
        </Button>
      )}

      {status === "running" && (
        <>
          <Button
            size={btnSize}
            variant="outline"
            onClick={onPause}
            className={cn(
              "gap-1 border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-500",
              actionPx,
              small && "h-7 text-xs",
            )}
          >
            <Pause className={iconClass} />
            Pause
          </Button>
          <Button
            size={btnSize}
            variant="outline"
            onClick={onStop}
            className={cn(
              "gap-1 border-red-500/50 hover:bg-red-500/10 hover:text-red-500",
              actionPx,
              small && "h-7 text-xs",
            )}
          >
            <Square className={iconClass} />
            Stop
          </Button>
        </>
      )}

      {status === "paused" && (
        <>
          <Button
            size={btnSize}
            onClick={onResume}
            className={cn(
              "gap-1 transition-all",
              startPx,
              small && "h-7 text-xs",
              "bg-green-600 hover:bg-green-700 text-white",
              !compact && "shadow-lg hover:shadow-green-500/25",
            )}
          >
            <Play className={iconClass} />
            Weiter
          </Button>
          <Button
            size={btnSize}
            variant="outline"
            onClick={onStop}
            className={cn(
              "gap-1 border-red-500/50 hover:bg-red-500/10 hover:text-red-500",
              actionPx,
              small && "h-7 text-xs",
            )}
          >
            <Square className={iconClass} />
            Stop
          </Button>
        </>
      )}

      {hasSegments && status === "idle" && (
        <Button
          size={btnSize}
          variant="ghost"
          onClick={onReset}
          aria-label="Zurücksetzen"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          {!compact && "Zuruecksetzen"}
        </Button>
      )}
    </div>
  )
}
