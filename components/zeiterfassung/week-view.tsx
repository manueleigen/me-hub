"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TimeEntryList } from "./time-entry-list"
import type { WeekSummary } from "@/types/zeiterfassung"
import { cn } from "@/lib/utils"

interface WeekViewProps {
  summary: WeekSummary
  onUpdate?: () => void
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
const TARGET_HOURS_PER_DAY = 8
const TARGET_HOURS_PER_WEEK = 40

export function WeekView({ summary, onUpdate }: WeekViewProps) {
  const progress = (summary.totalHours / TARGET_HOURS_PER_WEEK) * 100
  
  return (
    <div className="space-y-6">
      {/* Week stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtstunden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</div>
            <Progress value={Math.min(progress, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              von {TARGET_HOURS_PER_WEEK}h Ziel
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abrechenbar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.billableHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((summary.billableHours / summary.totalHours) * 100 || 0).toFixed(0)}% der Gesamtzeit
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Umsatz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRevenue.toFixed(0)} EUR</div>
            <p className="text-xs text-muted-foreground mt-1">
              Diese Woche
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Durchschnitt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary.totalHours / 5).toFixed(1)}h/Tag
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mo-Fr Durchschnitt
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Day bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wochenuebersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {summary.days.map((day, index) => {
              const height = (day.totalHours / TARGET_HOURS_PER_DAY) * 100
              const isWeekend = index >= 5
              const isToday = day.date === new Date().toISOString().split("T")[0]
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-24 flex items-end">
                    <div
                      className={cn(
                        "w-full rounded-t transition-all",
                        isWeekend ? "bg-muted" : "bg-primary",
                        isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        day.totalHours === 0 && "bg-muted/50"
                      )}
                      style={{ height: `${Math.min(height, 100)}%`, minHeight: day.totalHours > 0 ? "4px" : "0" }}
                    />
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "text-xs font-medium",
                      isToday && "text-primary"
                    )}>
                      {WEEKDAYS[index]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.totalHours > 0 ? `${day.totalHours}h` : "-"}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Entries by day */}
      <div className="space-y-4">
        {summary.days
          .filter(day => day.entries.length > 0)
          .reverse()
          .map(day => (
            <div key={day.date}>
              <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>{formatDayHeader(day.date)}</span>
                <span className="text-muted-foreground">{day.totalHours}h</span>
              </h3>
              <TimeEntryList entries={day.entries} onUpdate={onUpdate} />
            </div>
          ))}
      </div>
    </div>
  )
}

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (dateStr === today.toISOString().split("T")[0]) {
    return "Heute"
  }
  if (dateStr === yesterday.toISOString().split("T")[0]) {
    return "Gestern"
  }
  
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}
