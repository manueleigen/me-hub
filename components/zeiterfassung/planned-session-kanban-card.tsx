"use client";

import { Clock, Building2, MoreHorizontal, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KanbanColumn } from "@/components/kanban-board";
import type { PlannedSession } from "@/types/zeiterfassung";
const WEEKDAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

interface PlannedSessionKanbanCardProps {
  session: PlannedSession;
  columns: KanbanColumn[];
  clientName: string;
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onMoveToColumn: (columnKey: string) => Promise<void>;
}

export function PlannedSessionKanbanCard({
  session,
  columns,
  clientName,
  onEdit,
  onComplete,
  onDelete,
  onMoveToColumn,
}: PlannedSessionKanbanCardProps) {
  const recurrenceLabel =
    session.recurrence === "daily"
      ? "Täglich"
      : session.recurrence === "weekly"
        ? `Wöchentlich (${WEEKDAYS[session.recurrenceDay ?? 0]})`
        : session.recurrence === "monthly"
          ? `Monatlich (Tag ${session.recurrenceDay})`
          : null;

  const currentColumnKey =
    session.recurrence === "weekly" && session.recurrenceDay != null
      ? String(session.recurrenceDay)
      : "flex";

  return (
    <div className="rounded-lg border bg-card p-2 text-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{session.title}</div>
          {session.recurrence !== "none" && recurrenceLabel && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {recurrenceLabel}
            </Badge>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-0.5">
              <Clock className="size-2.5" />
              {session.goalHours}h
            </span>
            {session.clientId && (
              <span className="flex items-center gap-0.5 truncate">
                <Building2 className="size-2.5 shrink-0" />
                {clientName}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6 shrink-0">
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-4" />
              Bearbeiten
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onComplete}>
              <CheckCircle2 className="mr-2 size-4" />
              Als erledigt
            </DropdownMenuItem>
            {columns
              .filter((col) => col.key !== currentColumnKey)
              .map((col) => (
                <DropdownMenuItem
                  key={col.key}
                  onClick={() => onMoveToColumn(col.key)}
                >
                  Nach {col.label}
                </DropdownMenuItem>
              ))}
            <DropdownMenuItem
              className="text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 size-4" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {session.deadline && (
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(session.deadline).toLocaleDateString("de-DE")}
        </p>
      )}
    </div>
  );
}

export function getPlannedSessionKanbanStatus(session: PlannedSession): string {
  if (session.recurrence === "weekly" && session.recurrenceDay != null) {
    return String(session.recurrenceDay);
  }
  return "flex";
}

export const PLANNED_KANBAN_COLUMNS: KanbanColumn[] = [
  { key: "1", label: "Montag", color: "bg-blue-500" },
  { key: "2", label: "Dienstag", color: "bg-blue-500" },
  { key: "3", label: "Mittwoch", color: "bg-blue-500" },
  { key: "4", label: "Donnerstag", color: "bg-blue-500" },
  { key: "5", label: "Freitag", color: "bg-blue-500" },
  { key: "6", label: "Samstag", color: "bg-violet-500" },
  { key: "0", label: "Sonntag", color: "bg-violet-500" },
  { key: "flex", label: "Flexibel", color: "bg-slate-400" },
];

export function applyPlannedSessionColumnMove(
  session: PlannedSession,
  columnKey: string,
): PlannedSession {
  if (columnKey === "flex") {
    return { ...session, recurrence: "none", recurrenceDay: undefined };
  }
  return {
    ...session,
    recurrence: "weekly",
    recurrenceDay: Number(columnKey),
  };
}

export function isPlannedKanbanColumnToday(columnKey: string): boolean {
  if (columnKey === "flex") return false;
  return columnKey === String(new Date().getDay());
}
