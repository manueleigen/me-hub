"use client"

import { useState } from "react"
import {
  Plus,
  Calendar,
  Clock,
  Repeat,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { KanbanBoard } from "@/components/kanban-board"
import {
  PlannedSessionKanbanCard,
  PLANNED_KANBAN_COLUMNS,
  getPlannedSessionKanbanStatus,
  applyPlannedSessionColumnMove,
} from "@/components/zeiterfassung/planned-session-kanban-card"
import type { Client } from "@/types/clients"
import type { Project } from "@/types/projects"
import { useVaultWriteEnabled } from "@/lib/vault-link-context"
import type { PlannedSession } from "@/types/zeiterfassung"

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]

interface PlannedSessionsProps {
  sessions: PlannedSession[]
  onSessionsChange: (sessions: PlannedSession[]) => void
  clients: Client[]
  projects: Project[]
}

export function PlannedSessions({
  sessions,
  onSessionsChange,
  clients,
  projects,
}: PlannedSessionsProps) {
  const vaultWriteEnabled = useVaultWriteEnabled();
  const setSessions = (
    updater: PlannedSession[] | ((prev: PlannedSession[]) => PlannedSession[]),
  ) => {
    onSessionsChange(typeof updater === "function" ? updater(sessions) : updater)
  }
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<PlannedSession | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    projectId: "",
    goalHours: 8,
    deadline: "",
    recurrence: "none" as PlannedSession["recurrence"],
    recurrenceDay: 1,
  })

  const resetForm = () => {
    setFormData({ title: "", clientId: "", projectId: "", goalHours: 8, deadline: "", recurrence: "none", recurrenceDay: 1 })
    setEditingSession(null)
  }

  const openNewDialog = () => { resetForm(); setIsDialogOpen(true) }

  const openEditDialog = (session: PlannedSession) => {
    setEditingSession(session)
    setFormData({
      title: session.title,
      clientId: session.clientId || "",
      projectId: session.projectId || "",
      goalHours: session.goalHours,
      deadline: session.deadline || "",
      recurrence: session.recurrence,
      recurrenceDay: session.recurrenceDay || 1,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingSession) {
      setSessions(prev => prev.map(s =>
        s.id === editingSession.id ? { ...s, ...formData, deadline: formData.deadline || null } : s,
      ))
    } else {
      setSessions(prev => [...prev, {
        id: crypto.randomUUID(),
        ...formData,
        clientId: formData.clientId || null,
        projectId: formData.projectId || null,
        deadline: formData.deadline || null,
        completed: false,
        createdAt: new Date(),
      }])
    }
    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => setSessions(prev => prev.filter(s => s.id !== id))
  const handleComplete = (id: string) =>
    setSessions(prev => prev.map(s => (s.id === id ? { ...s, completed: true } : s)))

  const handleKanbanMove = async (session: PlannedSession, columnKey: string) => {
    const updated = applyPlannedSessionColumnMove(session, columnKey)
    setSessions(prev => prev.map(s => (s.id === session.id ? updated : s)))
  }

  const getClientName = (id: string | null) =>
    id ? (clients.find(c => c.slug === id)?.name ?? id) : "Kein Kunde"
  const getRecurrenceLabel = (s: PlannedSession) => {
    if (s.recurrence === "daily") return "Täglich"
    if (s.recurrence === "weekly") return `Wöchentlich (${WEEKDAYS[s.recurrenceDay ?? 0]})`
    if (s.recurrence === "monthly") return `Monatlich (Tag ${s.recurrenceDay})`
    return null
  }

  const clientProjects = formData.clientId
    ? projects.filter(p => p.client === formData.clientId)
    : []
  const activeClients = clients.filter(c => c.status === "active")
  const pendingSessions = sessions.filter(s => !s.completed)
  const completedSessions = sessions.filter(s => s.completed)

  // Dialog component (shared between list + kanban)
  const dialogContent = (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{editingSession ? "Session bearbeiten" : "Neue Session planen"}</DialogTitle>
        <DialogDescription>Plane eine Arbeitssession mit Zielstunden und optionalem Zeitplan.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Titel</Label>
          <Input
            placeholder="z.B. Wöchentliche Projektarbeit"
            value={formData.title}
            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kunde</Label>
            <Select
              value={formData.clientId}
              onValueChange={v => setFormData(p => ({ ...p, clientId: v, projectId: "" }))}
            >
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                {activeClients.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Projekt</Label>
            <Select
              value={formData.projectId}
              onValueChange={v => setFormData(p => ({ ...p, projectId: v }))}
              disabled={!formData.clientId}
            >
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                {clientProjects.map(p => <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Zielstunden</Label>
            <Input
              type="number" min={1} max={24}
              value={formData.goalHours}
              onChange={e => setFormData(p => ({ ...p, goalHours: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Deadline</Label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Wiederholung</Label>
          <Select
            value={formData.recurrence}
            onValueChange={v => setFormData(p => ({ ...p, recurrence: v as PlannedSession["recurrence"] }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Wiederholung</SelectItem>
              <SelectItem value="daily">Täglich</SelectItem>
              <SelectItem value="weekly">Wöchentlich</SelectItem>
              <SelectItem value="monthly">Monatlich</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.recurrence === "weekly" && (
          <div className="space-y-2">
            <Label>Wochentag</Label>
            <Select
              value={formData.recurrenceDay.toString()}
              onValueChange={v => setFormData(p => ({ ...p, recurrenceDay: Number(v) }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {formData.recurrence === "monthly" && (
          <div className="space-y-2">
            <Label>Tag im Monat</Label>
            <Input
              type="number" min={1} max={31}
              value={formData.recurrenceDay}
              onChange={e => setFormData(p => ({ ...p, recurrenceDay: Number(e.target.value) }))}
            />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
        <Button onClick={handleSave} disabled={!formData.title}>
          {editingSession ? "Speichern" : "Erstellen"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  const SessionCard = ({ session }: { session: PlannedSession }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">{session.title}</span>
          {session.recurrence !== "none" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Repeat className="size-2.5" />
              {getRecurrenceLabel(session)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {session.clientId && (
            <span className="flex items-center gap-1">
              <Building2 className="size-3" />{getClientName(session.clientId)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" />{session.goalHours}h
          </span>
          {session.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(session.deadline).toLocaleDateString("de-DE")}
            </span>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7 shrink-0">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openEditDialog(session)}>
            <Pencil className="size-4 mr-2" /> Bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleComplete(session.id)}>
            <CheckCircle2 className="size-4 mr-2" /> Als erledigt
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(session.id)}>
            <Trash2 className="size-4 mr-2" /> Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Geplante Sessions</h2>
            <p className="text-sm text-muted-foreground">Plane deine Arbeitszeit im Voraus</p>
          </div>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} disabled={!vaultWriteEnabled}>
              <Plus className="size-4 mr-2" />
              Neue Session
            </Button>
          </DialogTrigger>
        </div>

        <Tabs defaultValue="liste">
          <TabsList>
            <TabsTrigger value="liste">Liste</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>

          {/* ── LIST VIEW ── */}
          <TabsContent value="liste" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ausstehend ({pendingSessions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">Keine geplanten Sessions.</p>
                ) : (
                  pendingSessions.map(s => <SessionCard key={s.id} session={s} />)
                )}
              </CardContent>
            </Card>

            {completedSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">
                    Erledigt ({completedSessions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedSessions.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border opacity-60">
                      <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                      <span className="flex-1 line-through text-sm">{s.title}</span>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── KANBAN VIEW ── */}
          <TabsContent value="kanban" className="mt-4">
            <KanbanBoard
              columns={PLANNED_KANBAN_COLUMNS}
              items={pendingSessions}
              getItemKey={(s) => s.id}
              getItemStatus={getPlannedSessionKanbanStatus}
              onStatusChange={handleKanbanMove}
              renderCard={(session, onMoveToColumn) => (
                <PlannedSessionKanbanCard
                  session={session}
                  columns={PLANNED_KANBAN_COLUMNS}
                  clientName={getClientName(session.clientId)}
                  onEdit={() => openEditDialog(session)}
                  onComplete={() => handleComplete(session.id)}
                  onDelete={() => handleDelete(session.id)}
                  onMoveToColumn={onMoveToColumn}
                />
              )}
            />
          </TabsContent>
        </Tabs>
      </div>

      {dialogContent}
    </Dialog>
  )
}
