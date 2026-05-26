"use client"

import { useEffect, useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  buildDonutChartSlices,
  donutSlicesToChartData,
  COLOR_WORK,
  COLOR_PAUSE,
} from "@/lib/zeiterfassung/segment-chart"
import type { TimeSegment } from "@/types/zeiterfassung"

/** Monospace + tabular figures for stable digit width while counting */
const timerDigitsClass =
  "font-mono tabular-nums tracking-tight [font-variant-numeric:tabular-nums]"

interface DonutTimerProps {
  segments: TimeSegment[]
  hours: number
  minutes: number
  seconds: number
  goalHours: number
  onGoalHoursChange?: (hours: number) => void
  isRunning: boolean
  isPaused: boolean
  mini?: boolean
  /** Medium size for embedded tracker widgets */
  compact?: boolean
  compactSize?: "default" | "small"
}

export function DonutTimer({
  segments,
  hours,
  minutes,
  seconds,
  goalHours,
  onGoalHoursChange,
  isRunning,
  isPaused,
  mini = false,
  compact = false,
  compactSize = "default",
}: DonutTimerProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isRunning && !isPaused) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [isRunning, isPaused])

  const chartSlices = useMemo(
    () => buildDonutChartSlices(segments, goalHours, new Date()),
    [segments, goalHours, tick, isRunning],
  )

  const data = useMemo(
    () => donutSlicesToChartData(chartSlices, goalHours),
    [chartSlices, goalHours],
  )

  const workMinutes = chartSlices
    .filter((s) => s.type === "work")
    .reduce((sum, s) => sum + s.minutes, 0)
  const pauseMinutes = chartSlices
    .filter((s) => s.type === "pause")
    .reduce((sum, s) => sum + s.minutes, 0)

  const progress =
    goalHours > 0 ? Math.min(workMinutes / 60 / goalHours, 1) : 0

  if (compact) {
    const small = compactSize === "small"
    const outerR = small ? 68 : 88
    const innerR = outerR - (small ? 14 : 18)
    const boxClass = small ? "w-36 h-36" : "w-44 h-44"
    const timeClass = small ? "text-2xl" : "text-3xl"
    const secClass = small ? "text-sm" : "text-base"
    return (
      <div className="flex flex-col items-center">
          <div className={cn("relative", boxClass)}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerR}
                outerRadius={outerR}
                startAngle={90}
                endAngle={-270}
                paddingAngle={1}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name + i} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              className={cn(
                timeClass,
                "font-bold transition-colors",
                timerDigitsClass,
                isRunning && "text-orange-500",
                isPaused && "text-purple-400",
                !isRunning && !isPaused && "text-muted-foreground",
              )}
            >
              {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}
              <span className={cn(secClass, "text-muted-foreground", timerDigitsClass)}>
                :{seconds.toString().padStart(2, "0")}
              </span>
            </div>
            {onGoalHoursChange ? (
              <div className={cn(
                "pointer-events-auto flex items-center gap-1 text-muted-foreground",
                small ? "mt-0.5 text-[10px]" : "mt-1 text-xs",
              )}>
                <Target className={cn("shrink-0", small ? "size-2.5" : "size-3")} />
                <Input
                  type="number"
                  min={1}
                  max={24}
                  step={0.5}
                  value={goalHours}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isNaN(v) && v >= 1 && v <= 24) onGoalHoursChange(v)
                  }}
                  className={cn(
                    "px-1 text-center",
                    timerDigitsClass,
                    small ? "h-5 w-9 text-[10px]" : "h-6 w-11 text-xs",
                  )}
                />
                <span>h</span>
              </div>
            ) : (
              <div className={cn(
                "text-muted-foreground",
                small ? "text-[10px] mt-0" : "text-xs mt-0.5",
              )}>
                Ziel {goalHours}h
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (mini) {
    const innerR = 18
    const outerR = 26
    return (
      <div className="relative w-14 h-14 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={outerR}
              startAngle={90}
              endAngle={-270}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={entry.name + i} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "text-[9px] font-bold leading-none",
              timerDigitsClass,
              isRunning && "text-orange-500",
              isPaused && "text-purple-400",
              !isRunning && !isPaused && "text-muted-foreground",
            )}
          >
            {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
    <div className="relative w-80 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={108}
            outerRadius={136}
            startAngle={90}
            endAngle={-270}
            paddingAngle={1}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={entry.name + i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const slice = chartSlices.find((s) => s.id === payload[0].name)
              if (!slice || slice.type === "remaining") return null
              const h = Math.floor(slice.minutes / 60)
              const m = slice.minutes % 60
              return (
                <div className="rounded-lg border bg-card px-2 py-1 text-xs shadow-md">
                  {slice.label}: {h > 0 ? `${h}h ` : ""}{m}min
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className={cn(
            "text-5xl font-bold transition-colors",
            timerDigitsClass,
            isRunning && "text-orange-500",
            isPaused && "text-purple-400",
            !isRunning && !isPaused && "text-muted-foreground",
          )}
        >
          {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}
          <span className={cn("text-2xl text-muted-foreground", timerDigitsClass)}>
            :{seconds.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="pointer-events-auto">
          {onGoalHoursChange ? (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <Target className="size-3.5 shrink-0" />
              <span>Ziel</span>
              <Input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={goalHours}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (!Number.isNaN(v) && v >= 1 && v <= 24) onGoalHoursChange(v)
                }}
                className={cn("h-7 w-14 px-1.5 text-center text-sm", timerDigitsClass)}
              />
              <span>Std Arbeit</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-1">
              Ziel {goalHours}:00 Std Arbeit
            </div>
          )}
        </div>
        {pauseMinutes > 0 && (
          <div className="text-xs text-purple-400 mt-0.5">
            {Math.floor(pauseMinutes / 60) > 0
              ? `${Math.floor(pauseMinutes / 60)}h `
              : ""}
            {pauseMinutes % 60}min Pause
          </div>
        )}
        {progress >= 1 && (
          <div className="mt-2 text-sm font-semibold text-orange-500 animate-pulse">
            Ziel erreicht!
          </div>
        )}
      </div>

      {isRunning && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: `0 0 70px ${COLOR_WORK}30` }}
        />
      )}
      {isPaused && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: `0 0 50px ${COLOR_PAUSE}40` }}
        />
      )}
    </div>
    {segments.length > 0 && (
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full" style={{ background: COLOR_WORK }} />
          Arbeit
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full" style={{ background: COLOR_PAUSE }} />
          Pause
        </span>
      </div>
    )}
    </div>
  )
}
