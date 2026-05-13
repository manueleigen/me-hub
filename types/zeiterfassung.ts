export interface TimeEntry {
  id: string
  date: string // YYYY-MM-DD
  project: string
  task: string
  hours: number
  description: string
  billable: boolean
  rate: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntryFormData {
  date: string
  project: string
  task: string
  hours: number
  description: string
  billable: boolean
  rate: number
  tags: string[]
}

export interface ProjectSummary {
  project: string
  totalHours: number
  billableHours: number
  totalRevenue: number
  entries: number
}

export interface DaySummary {
  date: string
  totalHours: number
  entries: TimeEntry[]
}

export interface WeekSummary {
  weekNumber: number
  year: number
  startDate: string
  endDate: string
  totalHours: number
  billableHours: number
  totalRevenue: number
  days: DaySummary[]
}

export interface MonthSummary {
  month: number
  year: number
  totalHours: number
  billableHours: number
  totalRevenue: number
  projectBreakdown: ProjectSummary[]
}

export type ViewMode = "day" | "week" | "month"

// Vault-backed types
export interface VaultTimeEntryFrontmatter {
  projectSlug: string;
  projectName: string;
  clientSlug?: string;
  clientName?: string;
  date: string;
  hours: number;
  description: string;
  rate: number;
  billable: boolean;
}

export interface VaultTimeEntry extends VaultTimeEntryFrontmatter {
  slug: string;
  sha?: string;
  status: "open" | "paid";
}

export interface ProjectOpenSummary {
  projectSlug: string;
  projectName: string;
  clientName?: string;
  totalHours: number;
  totalRevenue: number;
  entryCount: number;
  oldestDate: string;
  entries: VaultTimeEntry[];
}
