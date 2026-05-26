"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type BarProps,
} from "recharts"
import { Clock, Euro, FolderKanban, Zap, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type ZeiterfassungStatsPayload,
  COLOR_PLANNED,
  getWeekBarFill,
} from "@/lib/zeiterfassung/stats"

const BAR_LAYER_OFFSET = 6

type LayeredBarShapeProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  opacity?: number
}

/** Geplant — breiter, leicht nach links, liegt hinten */
function PlannedBarShape(props: LayeredBarShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, fill } = props
  if (height <= 0) return <g />
  return (
    <rect
      x={x - BAR_LAYER_OFFSET}
      y={y}
      width={width + BAR_LAYER_OFFSET * 2}
      height={height}
      fill={fill}
      rx={4}
      ry={4}
      opacity={0.85}
    />
  )
}

/** Erfasst — schmaler, leicht nach rechts, liegt vorne */
function WorkBarShape(props: LayeredBarShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, fill, opacity = 1 } = props
  if (height <= 0) return <g />
  return (
    <rect
      x={x + BAR_LAYER_OFFSET}
      y={y}
      width={Math.max(width - BAR_LAYER_OFFSET, 4)}
      height={height}
      fill={fill}
      rx={4}
      ry={4}
      opacity={opacity}
    />
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string
  progress?: number
  highlight?: boolean
}

function StatCard({ icon, label, value, subValue, progress, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card",
        highlight && "bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20",
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subValue && <div className="text-sm text-muted-foreground mt-0.5">{subValue}</div>}
      {progress !== undefined && (
        <div className="mt-2">
          <Progress value={Math.min(progress, 100)} className="h-1.5" />
          <div className="text-xs text-muted-foreground mt-1">{Math.min(progress, 100).toFixed(0)}% des Ziels</div>
        </div>
      )}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  )
}

interface TrackerStatisticsProps {
  stats: ZeiterfassungStatsPayload | null
  loading?: boolean
  weekGoalHours?: number
  monthGoalHours?: number
}

export function TrackerStatistics({
  stats,
  loading = false,
  weekGoalHours = 40,
  monthGoalHours = 160,
}: TrackerStatisticsProps) {
  const today = new Date().toISOString().split("T")[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-5" />
          Statistiken
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !stats ? (
          <StatsSkeleton />
        ) : (
        <Tabs defaultValue="week" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Diese Woche</TabsTrigger>
            <TabsTrigger value="month">Dieser Monat</TabsTrigger>
            <TabsTrigger value="all">Gesamt</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Clock className="size-4" />}
                label="Arbeitsstunden"
                value={`${stats.weekStats.totalHours.toFixed(1)}h`}
                subValue={`Ziel: ${weekGoalHours}h`}
                progress={(stats.weekStats.totalHours / weekGoalHours) * 100}
                highlight
              />
              <StatCard
                icon={<CalendarClock className="size-4" />}
                label="Geplant"
                value={`${stats.weekPlannedHours.toFixed(1)}h`}
                subValue="Ausstehende Sessions"
              />
              <StatCard
                icon={<Euro className="size-4" />}
                label="Offener Umsatz"
                value={`${stats.weekStats.openRevenue.toLocaleString("de-DE")} €`}
                subValue={stats.weekStats.totalHours > 0 ? `⌀ ${(stats.weekStats.openRevenue / stats.weekStats.totalHours).toFixed(0)} €/h` : undefined}
              />
              <StatCard
                icon={<FolderKanban className="size-4" />}
                label="Aktive Projekte"
                value={stats.weekStats.projectCount}
                subValue="Diese Woche"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: getWeekBarFill({ date: today, hours: 1, isToday: true }, today) }} />
                Heute (erfasst)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: getWeekBarFill({ date: "2000-01-01", hours: 1, isToday: false }, today) }} />
                Andere Tage (erfasst)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: COLOR_PLANNED }} />
                Geplant
              </span>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.weekData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  barGap={-18}
                  barCategoryGap="20%"
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}h`}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const row = stats.weekData.find((d) => d.label === label)
                      return (
                        <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md space-y-0.5">
                          <p className="font-medium">{label}</p>
                          {payload.map((p) => (
                            <p key={p.dataKey} className="text-muted-foreground">
                              {p.dataKey === "hours" ? "Erfasst" : "Geplant"}: {p.value}h
                            </p>
                          ))}
                          {row && row.date > today && (
                            <p className="text-xs text-muted-foreground">Zukünftig</p>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="plannedHours"
                    fill={COLOR_PLANNED}
                    maxBarSize={34}
                    shape={PlannedBarShape as BarProps["shape"]}
                  />
                  <Bar dataKey="hours" maxBarSize={26} shape={WorkBarShape as BarProps["shape"]}>
                    {stats.weekData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={getWeekBarFill(entry, today)}
                        opacity={entry.date > today ? 0.35 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Clock className="size-4" />}
                label="Arbeitsstunden"
                value={`${stats.monthStats.totalHours.toFixed(1)}h`}
                subValue={`Ziel: ${monthGoalHours}h`}
                progress={(stats.monthStats.totalHours / monthGoalHours) * 100}
                highlight
              />
              <StatCard
                icon={<CalendarClock className="size-4" />}
                label="Geplant"
                value={`${stats.monthPlannedHours.toFixed(1)}h`}
                subValue="Ausstehende Sessions"
              />
              <StatCard
                icon={<Euro className="size-4" />}
                label="Offener Umsatz"
                value={`${stats.monthStats.openRevenue.toLocaleString("de-DE")} €`}
                subValue={stats.monthStats.totalHours > 0 ? `⌀ ${(stats.monthStats.openRevenue / stats.monthStats.totalHours).toFixed(0)} €/h` : undefined}
              />
              <StatCard
                icon={<FolderKanban className="size-4" />}
                label="Aktive Projekte"
                value={stats.monthStats.projectCount}
                subValue="Diesen Monat"
              />
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatCard
                icon={<Clock className="size-4" />}
                label="Gesamtstunden"
                value={`${stats.allStats.totalHours.toFixed(1)}h`}
                highlight
              />
              <StatCard
                icon={<CalendarClock className="size-4" />}
                label="Geplant (gesamt)"
                value={`${stats.allPlannedHours.toFixed(1)}h`}
                subValue="Alle offenen Sessions"
              />
              <StatCard
                icon={<Euro className="size-4" />}
                label="Offen"
                value={`${stats.allStats.openRevenue.toLocaleString("de-DE")} €`}
                subValue="Nicht abgerechnet"
              />
              <StatCard
                icon={<Euro className="size-4" />}
                label="Bezahlt"
                value={`${stats.allStats.paidRevenue.toLocaleString("de-DE")} €`}
                subValue="Gesamtumsatz"
              />
              <StatCard
                icon={<FolderKanban className="size-4" />}
                label="Projekte"
                value={stats.allStats.projectCount}
                subValue="Insgesamt"
              />
            </div>
          </TabsContent>
        </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
