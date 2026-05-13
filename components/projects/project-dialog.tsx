"use client";

import { useState, useRef, KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, X } from "lucide-react";
import type { Project, ProjectFrontmatter, ProjectType } from "@/types/projects";
import type { Client } from "@/types/clients";
import { slugify } from "@/lib/frontmatter";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  clients?: Client[];
  onSave: (slug: string, data: ProjectFrontmatter, body: string, sha?: string) => Promise<void>;
}

function TagInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputVal("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  const remove = (item: string) => onChange(values.filter((v) => v !== item));

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div
        className="flex flex-wrap gap-1.5 min-h-9 rounded-md border bg-background px-3 py-2 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1 pr-1">
            {v}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(v); }}
              className="hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder="Eingabe + Enter"
          className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  clients = [],
  onSave,
}: ProjectDialogProps) {
  const isEdit = !!project;

  const [title, setTitle] = useState(project?.title ?? "");
  const [type, setType] = useState<ProjectType>(project?.type ?? "freelance");
  const [clientSlug, setClientSlug] = useState(project?.client ?? "");
  const [clientName, setClientName] = useState(project?.clientName ?? "");
  const [category, setCategory] = useState<string[]>(project?.category ?? []);
  const [skills, setSkills] = useState<string[]>(project?.skills ?? []);
  const [tools, setTools] = useState<string[]>(project?.tools ?? []);
  const [area, setArea] = useState<string[]>(project?.area ?? []);
  const [description, setDescription] = useState(
    project?.body ?? "## Details\n\n## Beschreibung\n"
  );
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle(project?.title ?? "");
    setType(project?.type ?? "freelance");
    setClientSlug(project?.client ?? "");
    setClientName(project?.clientName ?? "");
    setCategory(project?.category ?? []);
    setSkills(project?.skills ?? []);
    setTools(project?.tools ?? []);
    setArea(project?.area ?? []);
    setDescription(project?.body ?? "## Details\n\n## Beschreibung\n");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleClientSelect = (value: string) => {
    if (value === "__new__") {
      window.open("/clients", "_blank");
      return;
    }
    const client = clients.find((c) => c.slug === value);
    if (client) {
      setClientSlug(client.slug);
      setClientName(client.name);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const slug = isEdit ? project.slug : slugify(title);
      const data: ProjectFrontmatter = {
        type,
        title: title.trim(),
        clientName: clientName.trim() || undefined,
        client: clientSlug.trim() || undefined,
        category,
        skills,
        tools,
        area,
        date: project?.date ?? new Date().toISOString().split("T")[0],
      };
      await onSave(slug, data, description, project?.sha);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const selectedClientValue = clientSlug || "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Projekt bearbeiten" : "Neues Projekt"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="proj-title">Titel</Label>
            <Input
              id="proj-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Projekttitel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Typ</Label>
              <Select value={type} onValueChange={(v) => setType(v as ProjectType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="personal">Persönlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Klient</Label>
              <Select value={selectedClientValue} onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Klient wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">
                    <span className="flex items-center gap-1.5 text-primary">
                      <ExternalLink className="size-3" />
                      Neuen Klienten anlegen
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TagInput label="Kategorien" values={category} onChange={setCategory} />
          <TagInput label="Skills" values={skills} onChange={setSkills} />
          <TagInput label="Tools & Software" values={tools} onChange={setTools} />
          <TagInput label="Bereiche" values={area} onChange={setArea} />

          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Beschreibung</Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Projektbeschreibung…"
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
