export type ClientStatus = "active" | "paused" | "completed" | "prospect"
export type ProjectStatus = "planning" | "in-progress" | "review" | "completed" | "on-hold"

export interface Client {
  id: string
  name: string
  contact: string
  email: string
  phone?: string
  status: ClientStatus
  hourlyRate: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  clientId: string
  name: string
  description?: string
  status: ProjectStatus
  startDate?: string
  endDate?: string
  budget?: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ClientWithStats extends Client {
  totalHours: number
  totalRevenue: number
  projectCount: number
  activeProjects: number
}

export const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; color: string }> = {
  active: { label: "Aktiv", color: "bg-green-500" },
  paused: { label: "Pausiert", color: "bg-amber-500" },
  completed: { label: "Abgeschlossen", color: "bg-slate-500" },
  prospect: { label: "Interessent", color: "bg-blue-500" },
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: "Planung", color: "bg-slate-500" },
  "in-progress": { label: "In Arbeit", color: "bg-blue-500" },
  review: { label: "Review", color: "bg-amber-500" },
  completed: { label: "Abgeschlossen", color: "bg-green-500" },
  "on-hold": { label: "Pausiert", color: "bg-gray-400" },
}
