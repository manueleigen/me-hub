"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Clock,
  Euro,
  FolderKanban,
  Mail,
  Pencil,
  Phone,
  Plus,
} from "lucide-react"
import { getClientById, getClientProjects, getClientStats } from "@/lib/mock-data/kunden"
import { CLIENT_STATUS_CONFIG, PROJECT_STATUS_CONFIG } from "@/types/kunden"
import { TimeEntryList } from "@/components/zeiterfassung/time-entry-list"
import { cn } from "@/lib/utils"

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const client = getClientById(id)
  
  if (!client) {
    notFound()
  }
  
  const projects = getClientProjects(id)
  const stats = getClientStats(id)
  const statusConfig = CLIENT_STATUS_CONFIG[client.status]
  
  const initials = client.name
    .split(" ")
    .map(w => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Kunden", href: "/kunden" },
          { label: client.name },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <Link href="/kunden">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <Badge className={cn("text-white", statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{client.contact}</span>
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {client.email}
                </span>
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {client.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline">
            <Pencil className="mr-2 size-4" />
            Bearbeiten
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stunden gesamt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                {stats.billableHours.toFixed(1)}h abrechenbar
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
              <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(0)} EUR</div>
              <p className="text-xs text-muted-foreground">
                {client.hourlyRate} EUR/h Stundensatz
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projekte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projectCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeProjects} aktiv
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Durchschnitt/Monat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.monthlyData).length > 0
                  ? (stats.totalRevenue / Object.keys(stats.monthlyData).length).toFixed(0)
                  : 0} EUR
              </div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(stats.monthlyData).length} Monate
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">
              <FolderKanban className="size-4 mr-2" />
              Projekte ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="time">
              <Clock className="size-4 mr-2" />
              Zeiteintraege ({stats.recentEntries.length})
            </TabsTrigger>
            <TabsTrigger value="info">
              Informationen
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Neues Projekt
              </Button>
            </div>
            
            {projects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Keine Projekte fuer diesen Kunden.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map(project => {
                  const projStatus = PROJECT_STATUS_CONFIG[project.status]
                  return (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{project.name}</CardTitle>
                          <Badge className={cn("text-white", projStatus.color)}>
                            {projStatus.label}
                          </Badge>
                        </div>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {project.budget && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Budget</span>
                                <span>{project.budget.toLocaleString()} EUR</span>
                              </div>
                              <Progress value={Math.min((stats.totalRevenue / project.budget) * 100, 100)} />
                            </div>
                          )}
                          <div className="flex gap-1">
                            {project.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="time">
            <TimeEntryList entries={stats.recentEntries} showDate />
          </TabsContent>
          
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Kundeninformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Ansprechpartner
                    </h4>
                    <p>{client.contact}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      E-Mail
                    </h4>
                    <p>{client.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Telefon
                    </h4>
                    <p>{client.phone || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Stundensatz
                    </h4>
                    <p>{client.hourlyRate} EUR/h</p>
                  </div>
                </div>
                {client.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Notizen
                    </h4>
                    <p className="text-sm">{client.notes}</p>
                  </div>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground pt-4 border-t">
                  <span>Erstellt: {client.createdAt.toLocaleDateString("de-DE")}</span>
                  <span>Aktualisiert: {client.updatedAt.toLocaleDateString("de-DE")}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
