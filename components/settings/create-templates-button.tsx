"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createVaultTemplates } from "@/app/actions/setup";

export function CreateTemplatesButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ created: string[]; errors: string[] } | null>(null);

  const handleClick = async () => {
    setState("loading");
    try {
      const r = await createVaultTemplates();
      setResult(r);
      setState(r.errors.length === 0 ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={handleClick} disabled={state === "loading"}>
        {state === "loading" ? "Erstelle…" : "Templates erstellen"}
      </Button>
      {result && (
        <div className="text-sm text-muted-foreground space-y-0.5">
          {result.created.map((p) => (
            <div key={p} className="text-green-600">✓ {p}</div>
          ))}
          {result.errors.map((p) => (
            <div key={p} className="text-destructive">✗ {p} (Fehler)</div>
          ))}
        </div>
      )}
    </div>
  );
}
