"use client"

import { useState, useMemo } from "react"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Euro,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import type { VaultTimeEntry, TrackingSessionStatus } from "@/types/zeiterfassung"

export const PAGE_SIZE_OPTIONS = [10, 50, 100] as const
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

type SortField = "date" | "project" | "client" | "hours" | "revenue"
type SortOrder = "asc" | "desc"

const STATUS_CONFIG: Record<TrackingSessionStatus, { label: string; className: string }> = {
  draft:    { label: "Entwurf",    className: "border-muted-foreground/40 text-muted-foreground" },
  tracked:  { label: "Erfasst",    className: "border-blue-500/40 text-blue-400" },
  pending:  { label: "In Rechnung", className: "border-amber-500/40 text-amber-400" },
  paid:     { label: "Bezahlt",    className: "border-green-500/40 text-green-400" },
  done:     { label: "Erledigt",   className: "border-purple-500/40 text-purple-400" },
}

function StatusBadge({ status }: { status: TrackingSessionStatus | undefined }) {
  const s = status ?? "tracked"
  const cfg = STATUS_CONFIG[s]
  return (
    <Badge variant="outline" className={cn("text-xs shrink-0", cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

function SortTh({
  label,
  field,
  current,
  order,
  onSort,
  className,
}: {
  label: string
  field: SortField
  current: SortField
  order: SortOrder
  onSort: (f: SortField) => void
  className?: string
}) {
  const active = field === current
  return (
    <th
      className={cn(
        "px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors",
        className,
      )}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          order === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
        ) : (
          <ChevronsUpDown className="size-3 opacity-30" />
        )}
      </span>
    </th>
  )
}

interface SessionsListingProps {
  entries: VaultTimeEntry[]
  onEdit?: (entry: VaultTimeEntry) => void
  onDelete?: (entry: VaultTimeEntry) => void
  onMarkPaid?: (entries: VaultTimeEntry[]) => void
  compact?: boolean
  /** Server-side pagination */
  paginated?: boolean
  page?: number
  pageSize?: PageSizeOption
  total?: number
  totalOpen?: number
  totalPaid?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: PageSizeOption) => void
  onTabChange?: (tab: "open" | "paid") => void
  activeTab?: "open" | "paid"
}

export function SessionsListing({
  entries,
  onEdit,
  onDelete,
  onMarkPaid,
  compact = false,
  paginated = false,
  page = 1,
  pageSize = 10,
  total,
  totalOpen,
  totalPaid,
  onPageChange,
  onPageSizeChange,
  onTabChange,
  activeTab,
}: SessionsListingProps) {
  const today = new Date().toISOString().split("T")[0]
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [internalTab, setInternalTab] = useState<"open" | "paid">("open")

  const tab = activeTab ?? internalTab
  const setTab = (next: "open" | "paid") => {
    onTabChange?.(next)
    if (!activeTab) setInternalTab(next)
  }

  const openCount = totalOpen ?? entries.filter(e => e.status === "open").length
  const paidCount = totalPaid ?? entries.filter(e => e.status === "paid").length
  const openEntries = useMemo(() => entries.filter(e => e.status === "open"), [entries])
  const paidEntries = useMemo(() => entries.filter(e => e.status === "paid"), [entries])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const filtered = useMemo(() => {
    let pool = paginated ? entries : tab === "open" ? openEntries : paidEntries
    if (search) {
      const q = search.toLowerCase()
      pool = pool.filter(
        e =>
          e.description.toLowerCase().includes(q) ||
          e.projectName.toLowerCase().includes(q) ||
          (e.clientName ?? "").toLowerCase().includes(q),
      )
    }
    return [...pool].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "date":    cmp = a.date.localeCompare(b.date); break
        case "project": cmp = a.projectName.localeCompare(b.projectName); break
        case "client":  cmp = (a.clientName ?? "").localeCompare(b.clientName ?? ""); break
        case "hours":   cmp = a.hours - b.hours; break
        case "revenue": cmp = (a.billable ? a.hours * a.rate : 0) - (b.billable ? b.hours * b.rate : 0); break
      }
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [tab, openEntries, paidEntries, entries, paginated, search, sortField, sortOrder])

  const totalPages = paginated && total ? Math.max(1, Math.ceil(total / pageSize)) : 1

  const toggleSelect = (slug: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  const toggleAll = () => {
    const slugs = filtered.map(e => e.slug)
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(slugs))
  }

  const selectedEntries = filtered.filter(e => selected.has(e.slug))
  const totalSelected = {
    hours: selectedEntries.reduce((s, e) => s + e.hours, 0),
    revenue: selectedEntries.reduce((s, e) => s + (e.billable ? e.hours * e.rate : 0), 0),
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })

  const content = (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex rounded-md overflow-hidden border text-sm">
          <button
            onClick={() => { setTab("open"); setSelected(new Set()); onPageChange?.(1) }}
            className={cn("px-3 py-1.5 transition-colors", tab === "open" ? "bg-muted font-medium" : "hover:bg-muted/50")}
          >
            Offen ({openCount})
          </button>
          <button
            onClick={() => { setTab("paid"); setSelected(new Set()); onPageChange?.(1) }}
            className={cn("px-3 py-1.5 border-l transition-colors", tab === "paid" ? "bg-muted font-medium" : "hover:bg-muted/50")}
          >
            Bezahlt ({paidCount})
          </button>
        </div>
        <div className="flex items-center gap-2">
          {paginated && onPageSizeChange && (
            <Select
              value={String(pageSize)}
              onValueChange={v => {
                onPageSizeChange(Number(v) as PageSizeOption)
                onPageChange?.(1)
              }}
            >
              <SelectTrigger className="h-8 w-[88px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Keine Einträge gefunden.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2 w-8">
                  <Checkbox
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <SortTh label="Datum"    field="date"    current={sortField} order={sortOrder} onSort={handleSort} />
                <SortTh label="Projekt"  field="project" current={sortField} order={sortOrder} onSort={handleSort} />
                <SortTh label="Kunde"    field="client"  current={sortField} order={sortOrder} onSort={handleSort} />
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Beschreibung</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                <SortTh label="Std"      field="hours"   current={sortField} order={sortOrder} onSort={handleSort} />
                <SortTh label="Betrag"   field="revenue" current={sortField} order={sortOrder} onSort={handleSort} />
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(entry => {
                const amount = entry.billable ? entry.hours * entry.rate : 0
                return (
                  <tr
                    key={entry.slug}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      selected.has(entry.slug) && "bg-muted/20",
                    )}
                  >
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selected.has(entry.slug)}
                        onCheckedChange={() => toggleSelect(entry.slug)}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{entry.projectName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {entry.clientName || "–"}
                    </td>
                    <td className="px-3 py-2 max-w-[160px] truncate text-muted-foreground">
                      {entry.description || "–"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={entry.trackingStatus} />
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 whitespace-nowrap font-semibold text-right",
                        entry.date !== today && "text-yellow-600 dark:text-yellow-500",
                      )}
                    >
                      <span className="flex items-center justify-end gap-1">
                        <Clock
                          className={cn(
                            "size-3",
                            entry.date === today
                              ? "text-muted-foreground"
                              : "text-yellow-600/80 dark:text-yellow-500/80",
                          )}
                        />
                        {entry.hours}h
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-muted-foreground">
                      {amount > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          <Euro className="size-3" />{amount.toFixed(0)}
                        </span>
                      ) : "–"}
                    </td>
                    <td className="px-3 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                            <Pencil className="size-4 mr-2" /> Bearbeiten
                          </DropdownMenuItem>
                          {entry.status === "open" && (
                            <DropdownMenuItem onClick={() => onMarkPaid?.([entry])}>
                              <CheckCircle2 className="size-4 mr-2" /> Als bezahlt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete?.(entry)}
                          >
                            <Trash2 className="size-4 mr-2" /> Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {paginated && totalPages > 1 && onPageChange && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page > 1) onPageChange(page - 1)
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum = i + 1
              if (totalPages > 7) {
                if (page <= 4) pageNum = i + 1
                else if (page >= totalPages - 3) pageNum = totalPages - 6 + i
                else pageNum = page - 3 + i
              }
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    isActive={pageNum === page}
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(pageNum)
                    }}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page < totalPages) onPageChange(page + 1)
                }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card">
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selected.size}</span> ausgewählt
            {" · "}<span className="font-medium text-foreground">{totalSelected.hours.toFixed(1)}h</span>
            {" · "}<span className="font-medium text-foreground">{totalSelected.revenue.toFixed(0)} €</span>
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              Aufheben
            </Button>
            {tab === "open" && (
              <Button size="sm" onClick={() => { onMarkPaid?.(selectedEntries); setSelected(new Set()) }}>
                <CheckCircle2 className="size-4 mr-2" />
                Als bezahlt
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (compact) return content

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4" />
          Zeiteinträge
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
