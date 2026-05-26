"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ColumnConfig<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterType?: "text" | "select" | "none";
  filterOptions?: { value: string; label: string }[];
  getValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
}

interface SortableTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

type SortDir = "asc" | "desc" | null;

export function SortableTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  emptyMessage = "Keine Einträge",
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const processedData = useMemo(() => {
    let result = [...data];

    for (const col of columns) {
      const filterVal = filters[col.key];
      if (!filterVal || !col.getValue) continue;
      if (col.filterType === "text") {
        result = result.filter((row) =>
          String(col.getValue!(row))
            .toLowerCase()
            .includes(filterVal.toLowerCase()),
        );
      } else if (col.filterType === "select") {
        result = result.filter(
          (row) => String(col.getValue!(row)) === filterVal,
        );
      }
    }

    if (sortKey && sortDir) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.getValue) {
        result.sort((a, b) => {
          const av = col.getValue!(a);
          const bv = col.getValue!(b);
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }

    return result;
  }, [data, columns, filters, sortKey, sortDir]);

  const hasFilters = columns.some(
    (c) => c.filterType && c.filterType !== "none",
  );

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className="px-4">
                  {col.sortable ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-foreground text-foreground"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
            {hasFilters && (
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {columns.map((col) => (
                  <TableHead key={col.key} className="py-1.5 px-4">
                    {col.filterType === "text" && (
                      <Input
                        className="h-7 text-xs font-normal"
                        placeholder="Filtern…"
                        value={filters[col.key] ?? ""}
                        onChange={(e) => setFilter(col.key, e.target.value)}
                      />
                    )}
                    {col.filterType === "select" && (
                      <select
                        className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs font-normal outline-none cursor-pointer"
                        value={filters[col.key] ?? ""}
                        onChange={(e) => setFilter(col.key, e.target.value)}
                      >
                        <option value="">Alle</option>
                        {col.filterOptions?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className="px-4 py-3">
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
