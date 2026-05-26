"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Pencil, Trash2, Mail, Phone } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { clientDetailPath } from "@/lib/workspace-paths";
import type { Client } from "@/types/clients";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: "Aktiv",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  prospect: {
    label: "Interessent",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  inactive: {
    label: "Inaktiv",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
};

const TYPE_LABELS: Record<string, string> = {
  company: "Unternehmen",
  agency: "Agentur",
  ngo: "NGO",
  individual: "Privatperson",
  startup: "Startup",
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return (
    <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm shrink-0">
      {initials}
    </div>
  );
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const workspaceSlug = useWorkspace()?.workspace.slug;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.inactive;

  const handleDelete = () => {
    setDeleting(true);
    try {
      onDelete(client);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Card className="flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <Initials name={client.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <Link href={clientDetailPath(workspaceSlug, client.slug)} className="font-semibold text-sm leading-tight hover:underline">
                  {client.name}
                </Link>
                <Badge className={`text-xs shrink-0 ${statusCfg.className}`}>
                  {statusCfg.label}
                </Badge>
              </div>
              {client.type && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {TYPE_LABELS[client.type] ?? client.type}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-2 space-y-1">
          {client.contact && (
            <p className="text-xs text-muted-foreground">{client.contact}</p>
          )}
          {client.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="size-3 text-muted-foreground shrink-0" />
              <a
                href={`mailto:${client.email}`}
                className="text-xs text-muted-foreground hover:text-foreground truncate"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="size-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{client.phone}</span>
            </div>
          )}
          {client.hourlyRate ? (
            <p className="text-xs text-muted-foreground">{client.hourlyRate} €/h</p>
          ) : null}
        </CardContent>

        <CardFooter className="pt-2 justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onEdit(client)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Klient löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{client.name}" wird dauerhaft aus dem Vault gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Löschen…" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
