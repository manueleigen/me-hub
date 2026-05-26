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
  trackingStatus?: TrackingSessionStatus;
  goalHours?: number;
  segmentsJson?: string;
}

export type TimeEntryFolder =
  | "time-tracking/open"
  | "time-tracking/sessions"
  | "time-tracking/paid";

export interface VaultTimeEntry extends VaultTimeEntryFrontmatter {
  slug: string;
  sha?: string;
  status: "open" | "paid";
  /** Vault folder this entry was loaded from (open vs sessions vs paid). */
  folder: TimeEntryFolder;
  trackingStatus?: TrackingSessionStatus;
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

// New types for the gamified time tracker

export type TimerStatus = "idle" | "running" | "paused"

export type TrackingSessionStatus = "draft" | "tracked" | "pending" | "paid" | "done"

export interface TimeSegment {
  id: string
  startTime: string // HH:mm
  endTime: string | null // HH:mm or null if ongoing
  type: "work" | "pause"
  label?: string
}

export interface TrackingSession {
  id: string
  date: string
  clientId: string | null
  projectId: string | null
  description: string
  hourlyRate: number
  goalHours: number
  segments: TimeSegment[]
  status: "draft" | "open" | "paid"
  totalWorkMinutes: number
  createdAt: Date
  updatedAt: Date
}

export interface PlannedSession {
  id: string
  clientId: string | null
  projectId: string | null
  title: string
  goalHours: number
  deadline: string | null // ISO date
  recurrence: "none" | "daily" | "weekly" | "monthly"
  recurrenceDay?: number // day of week (0-6) or day of month
  completed: boolean
  createdAt: Date
}

export interface TrackerStats {
  allTime: {
    totalHours: number
    goalHours: number
    openRevenue: number
    paidRevenue: number
    projectCount: number
  }
  week: {
    totalHours: number
    goalHours: number
    openRevenue: number
    projectCount: number
  }
  month: {
    totalHours: number
    goalHours: number
    openRevenue: number
    projectCount: number
  }
}
