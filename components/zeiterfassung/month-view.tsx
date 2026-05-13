"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MonthSummary } from "@/types/zeiterfassung"
import { getProjectById } from "@/lib/mock-data/zeiterfassung"

interface MonthViewProps {
  summary: MonthSummary
}

const MONTH_NAMES = [
  "Januar", "Februar", "Maerz", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
]

export function MonthView({ summary }: MonthViewProps) {
  const maxHours = Math.max(...summary.projectBreakdown.map(p => p.totalHours), 1)
  
  return (
    <div className="space-y-6">
      {/* Month stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtstunden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalHours.toFixed(1)}h</div>
            <p className="text-sm text-muted-foreground mt-1">
              {MONTH_NAMES[summary.month]} {summary.year}
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
            <div className="text-3xl font-bold">{summary.billableHours.toFixed(1)}h</div>
            <p className="text-sm text-muted-foreground mt-1">
              {((summary.billableHours / summary.totalHours) * 100 || 0).toFixed(0)}% abrechenbar
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
            <div className="text-3xl font-bold">{summary.totalRevenue.toFixed(0)} EUR</div>
            <p className="text-sm text-muted-foreground mt-1">
              Durchschnitt: {(summary.totalRevenue / summary.billableHours || 0).toFixed(0)} EUR/h
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Project breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Projekte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.projectBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keine Projekte in diesem Monat.</p>
          ) : (
            summary.projectBreakdown
              .sort((a, b) => b.totalHours - a.totalHours)
              .map(project => {
                const projectInfo = getProjectById(project.project)
                const percentage = (project.totalHours / maxHours) * 100
                
                return (
                  <div key={project.project} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{projectInfo?.name || project.project}</span>
                        <span className="text-muted-foreground ml-2">
                          ({project.entries} Eintraege)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{project.totalHours.toFixed(1)}h</span>
                        {project.totalRevenue > 0 && (
                          <span className="text-muted-foreground ml-2">
                            {project.totalRevenue.toFixed(0)} EUR
                          </span>
                        )}
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })
          )}
        </CardContent>
      </Card>
      
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aufteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Abrechenbare Stunden</span>
                <span className="font-medium">{summary.billableHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nicht abrechenbar</span>
                <span className="font-medium">{(summary.totalHours - summary.billableHours).toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Abrechenbar-Quote</span>
                <span className="font-medium">
                  {((summary.billableHours / summary.totalHours) * 100 || 0).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Durchschnitte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stunden pro Woche</span>
                <span className="font-medium">{(summary.totalHours / 4).toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Umsatz pro Woche</span>
                <span className="font-medium">{(summary.totalRevenue / 4).toFixed(0)} EUR</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Durchschnittlicher Stundensatz</span>
                <span className="font-medium">
                  {(summary.totalRevenue / summary.billableHours || 0).toFixed(0)} EUR
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
