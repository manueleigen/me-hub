"use client";

import { useState } from "react";
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
import type { Client, ClientFrontmatter, ClientStatus } from "@/types/clients";

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onSave: (slug: string, data: ClientFrontmatter, sha?: string) => Promise<void>;
}

export function ClientDialog({ open, onOpenChange, client, onSave }: ClientDialogProps) {
  const isEdit = !!client;

  const [name, setName] = useState(client?.name ?? "");
  const [type, setType] = useState(client?.type ?? "");
  const [contact, setContact] = useState(client?.contact ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [website, setWebsite] = useState(client?.website ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [hourlyRate, setHourlyRate] = useState(String(client?.hourlyRate ?? ""));
  const [status, setStatus] = useState<ClientStatus>(client?.status ?? "prospect");
  const [since, setSince] = useState(client?.since ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(client?.name ?? "");
    setType(client?.type ?? "");
    setContact(client?.contact ?? "");
    setEmail(client?.email ?? "");
    setPhone(client?.phone ?? "");
    setWebsite(client?.website ?? "");
    setAddress(client?.address ?? "");
    setHourlyRate(String(client?.hourlyRate ?? ""));
    setStatus(client?.status ?? "prospect");
    setSince(client?.since ?? "");
    setNotes(client?.notes ?? "");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const slugify = (s: string) =>
        s.toLowerCase()
          .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
          .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

      const slug = isEdit ? client.slug : slugify(name.trim());
      const data: ClientFrontmatter = {
        name: name.trim(),
        type: type.trim() || undefined,
        contact: contact.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        status,
        since: since || new Date().toISOString().split("T")[0],
        notes: notes || undefined,
      };
      await onSave(slug, data, client?.sha);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Klient bearbeiten" : "Neuer Klient"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="client-name">Name</Label>
              <Input
                id="client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Klientenname"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Typ</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Unternehmen</SelectItem>
                  <SelectItem value="agency">Agentur</SelectItem>
                  <SelectItem value="ngo">NGO</SelectItem>
                  <SelectItem value="individual">Privatperson</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="prospect">Interessent</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-contact">Ansprechpartner</Label>
            <Input
              id="client-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Max Mustermann"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="client-email">E-Mail</Label>
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-phone">Telefon</Label>
              <Input
                id="client-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 123 456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="client-website">Website</Label>
              <Input
                id="client-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-rate">Stundensatz (€)</Label>
              <Input
                id="client-rate"
                type="number"
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="75"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="client-address">Adresse</Label>
              <Input
                id="client-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Musterstraße 1, Berlin"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-since">Kunde seit</Label>
              <Input
                id="client-since"
                type="date"
                value={since}
                onChange={(e) => setSince(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-notes">Notizen</Label>
            <Textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interne Notizen…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
