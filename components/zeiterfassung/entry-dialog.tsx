"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VaultTimeEntry, VaultTimeEntryFrontmatter } from "@/types/zeiterfassung";
import type { Project } from "@/types/projects";
import type { Client } from "@/types/clients";

interface EntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  clients: Client[];
  entry?: VaultTimeEntry;
  onSave: (slug: string, data: VaultTimeEntryFrontmatter, sha?: string) => Promise<void>;
}

function makeSlug(date: string, projectSlug: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${date}-${projectSlug}-${rand}`;
}

export function EntryDialog({
  open,
  onOpenChange,
  projects,
  clients,
  entry,
  onSave,
}: EntryDialogProps) {
  const isEdit = !!entry;
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(entry?.date ?? today);
  const [projectSlug, setProjectSlug] = useState(entry?.projectSlug ?? "");
  const [projectName, setProjectName] = useState(entry?.projectName ?? "");
  const [clientSlug, setClientSlug] = useState(entry?.clientSlug ?? "");
  const [clientName, setClientName] = useState(entry?.clientName ?? "");
  const [hours, setHours] = useState(entry?.hours ?? 1);
  const [description, setDescription] = useState(entry?.description ?? "");
  const [rate, setRate] = useState(entry?.rate ?? 0);
  const [billable, setBillable] = useState(entry?.billable ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(entry?.date ?? today);
    setProjectSlug(entry?.projectSlug ?? "");
    setProjectName(entry?.projectName ?? "");
    setClientSlug(entry?.clientSlug ?? "");
    setClientName(entry?.clientName ?? "");
    setHours(entry?.hours ?? 1);
    setDescription(entry?.description ?? "");
    setRate(entry?.rate ?? 0);
    setBillable(entry?.billable ?? false);
  }, [open, entry, today]);

  const handleProjectChange = (slug: string) => {
    const project = projects.find((p) => p.slug === slug);
    if (!project) return;
    setProjectSlug(project.slug);
    setProjectName(project.title);

    // Auto-fill client from project
    const linkedClient = clients.find((c) => c.slug === project.client);
    if (linkedClient) {
      setClientSlug(linkedClient.slug);
      setClientName(linkedClient.name);
      const r = linkedClient.hourlyRate ?? 0;
      setRate(r);
      setBillable(r > 0);
    } else {
      setClientSlug("");
      setClientName(project.clientName ?? "");
      setRate(0);
      setBillable(false);
    }
  };

  const handleSave = async () => {
    if (!projectSlug || !date || hours <= 0) return;
    setSaving(true);
    try {
      const slug = isEdit ? entry.slug : makeSlug(date, projectSlug);
      const data: VaultTimeEntryFrontmatter = {
        projectSlug,
        projectName,
        clientSlug: clientSlug || undefined,
        clientName: clientName || undefined,
        date,
        hours,
        description,
        rate,
        billable,
      };
      await onSave(slug, data, entry?.sha);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Eintrag bearbeiten" : "Zeit erfassen"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="entry-date">Datum</Label>
              <Input
                id="entry-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entry-hours">Stunden</Label>
              <Input
                id="entry-hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Projekt</Label>
            <Select value={projectSlug} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Projekt wählen…" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    <span>{p.title}</span>
                    {p.clientName && (
                      <span className="text-muted-foreground ml-1.5">· {p.clientName}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clientName && (
            <div className="text-sm text-muted-foreground px-0.5">
              Klient: {clientName}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="entry-desc">Beschreibung</Label>
            <Input
              id="entry-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was wurde gemacht?"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="entry-billable" className="cursor-pointer">
                Abrechenbar
              </Label>
              <p className="text-xs text-muted-foreground">
                {billable ? `${rate} EUR/h · ${(hours * rate).toFixed(0)} EUR` : "Nicht abrechenbar"}
              </p>
            </div>
            <Switch
              id="entry-billable"
              checked={billable}
              onCheckedChange={setBillable}
            />
          </div>

          {billable && (
            <div className="space-y-1.5">
              <Label htmlFor="entry-rate">Stundensatz (EUR)</Label>
              <Input
                id="entry-rate"
                type="number"
                min="0"
                step="5"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !projectSlug || !date || hours <= 0}
          >
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
