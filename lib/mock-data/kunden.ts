import type { Client, Project, ClientWithStats } from "@/types/kunden"
import { mockTimeEntries, mockProjects as timeProjects } from "@/lib/mock-data/zeiterfassung"

export const mockClients: Client[] = [
  {
    id: "modulap",
    name: "Modulap GmbH",
    contact: "Thomas Mueller",
    email: "thomas@modulap.de",
    phone: "+49 30 12345678",
    status: "active",
    hourlyRate: 85,
    notes: "Langfristiger Kunde, Fokus auf Konfigurator-Entwicklung.",
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "specialolympics",
    name: "Special Olympics",
    contact: "Sarah Weber",
    email: "s.weber@specialolympics.de",
    phone: "+49 30 87654321",
    status: "active",
    hourlyRate: 75,
    notes: "Non-Profit Projekt, reduzierter Stundensatz.",
    createdAt: new Date("2023-09-01"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "beispiel-gmbh",
    name: "Beispiel GmbH",
    contact: "Max Mustermann",
    email: "max@beispiel.de",
    phone: "+49 123 456789",
    status: "active",
    hourlyRate: 120,
    notes: "Neuer Kunde seit Januar 2024.",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "techstartup",
    name: "TechStartup AG",
    contact: "Lisa Schmidt",
    email: "lisa@techstartup.io",
    status: "prospect",
    hourlyRate: 95,
    notes: "Erste Gespraeche gefuehrt, wartet auf Budget-Freigabe.",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "oldclient",
    name: "Alte Firma AG",
    contact: "Peter Alt",
    email: "peter@altefirma.de",
    status: "completed",
    hourlyRate: 80,
    notes: "Projekt 2023 erfolgreich abgeschlossen.",
    createdAt: new Date("2022-01-01"),
    updatedAt: new Date("2023-12-01"),
  },
]

export const mockClientProjects: Project[] = [
  {
    id: "proj-1",
    clientId: "modulap",
    name: "Konfigurator 3.0",
    description: "Neuentwicklung des Produkt-Konfigurators mit React",
    status: "in-progress",
    startDate: "2024-01-15",
    budget: 15000,
    tags: ["react", "konfigurator", "frontend"],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "proj-2",
    clientId: "modulap",
    name: "Icon Set",
    description: "Custom Icon Set fuer die neue UI",
    status: "review",
    startDate: "2024-02-01",
    budget: 2500,
    tags: ["design", "icons"],
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-14"),
  },
  {
    id: "proj-3",
    clientId: "specialolympics",
    name: "Website Relaunch",
    description: "Redesign und technische Modernisierung",
    status: "in-progress",
    startDate: "2023-10-01",
    budget: 12000,
    tags: ["website", "nextjs", "design"],
    createdAt: new Date("2023-09-15"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "proj-4",
    clientId: "beispiel-gmbh",
    name: "Dashboard App",
    description: "Internes Analytics Dashboard",
    status: "planning",
    startDate: "2024-02-20",
    budget: 8000,
    tags: ["dashboard", "analytics", "react"],
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-15"),
  },
]

export function getClientById(id: string): Client | undefined {
  return mockClients.find(c => c.id === id)
}

export function getClientProjects(clientId: string): Project[] {
  return mockClientProjects.filter(p => p.clientId === clientId)
}

export function getClientTimeEntries(clientId: string) {
  return mockTimeEntries.filter(e => e.project === clientId)
}

export function getClientsWithStats(): ClientWithStats[] {
  return mockClients.map(client => {
    const entries = getClientTimeEntries(client.id)
    const projects = getClientProjects(client.id)
    
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
    const totalRevenue = entries
      .filter(e => e.billable)
      .reduce((sum, e) => sum + e.hours * e.rate, 0)
    
    return {
      ...client,
      totalHours,
      totalRevenue,
      projectCount: projects.length,
      activeProjects: projects.filter(p => p.status === "in-progress").length,
    }
  })
}

export function getClientStats(clientId: string) {
  const entries = getClientTimeEntries(clientId)
  const projects = getClientProjects(clientId)
  
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
  const billableHours = entries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0)
  const totalRevenue = entries.filter(e => e.billable).reduce((sum, e) => sum + e.hours * e.rate, 0)
  
  // Group by month
  const monthlyData = entries.reduce((acc, e) => {
    const month = e.date.substring(0, 7) // YYYY-MM
    if (!acc[month]) {
      acc[month] = { hours: 0, revenue: 0 }
    }
    acc[month].hours += e.hours
    if (e.billable) {
      acc[month].revenue += e.hours * e.rate
    }
    return acc
  }, {} as Record<string, { hours: number; revenue: number }>)
  
  return {
    totalHours,
    billableHours,
    totalRevenue,
    projectCount: projects.length,
    activeProjects: projects.filter(p => p.status === "in-progress").length,
    monthlyData,
    recentEntries: entries.slice(0, 10),
  }
}
