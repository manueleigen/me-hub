"use server";

import { createOrUpdateGitHubFile } from "@/app/actions/github";

const TEMPLATES: { path: string; content: string }[] = [
  {
    path: "projects/_template.md",
    content: `---
type: client
title: Projektname
client: kunden-slug
clientName: Kundenname
category: []
skills: []
tools: []
area: []
status: active
date: 2026-01-01
---
## Details

## Beschreibung
`,
  },
  {
    path: "clients/_template.md",
    content: `---
name: Kundenname
type: Agentur
contact: Max Muster
email: info@beispiel.de
phone: +49 000 000000
website: https://beispiel.de
address: Musterstraße 1, 00000 Stadt
hourlyRate: 90
status: active
since: 2026-01-01
notes: ""
---
# Kundenname

## Kontakt

## Notizen
`,
  },
  {
    path: "time-tracking/open/_template.md",
    content: `---
projectSlug: projekt-slug
projectName: Projektname
clientSlug: kunden-slug
clientName: Kundenname
date: 2026-01-01
hours: 1
description: Was wurde gemacht?
rate: 90
billable: true
---
# Projektname – 2026-01-01

Was wurde gemacht?
`,
  },
  {
    path: "product-ideas/sonstiges/_template.md",
    content: `---
title: Ideentitel
description: Kurzbeschreibung der Idee
category: Sonstiges
status: idea
priority: medium
targetAudience: ""
potentialRevenue: ""
effortEstimate: ""
tags: []
notes: ""
---
# Ideentitel
`,
  },
];

export async function createVaultTemplates(): Promise<{ created: string[]; errors: string[] }> {
  const created: string[] = [];
  const errors: string[] = [];

  await Promise.all(
    TEMPLATES.map(async ({ path, content }) => {
      try {
        await createOrUpdateGitHubFile(path, content, `Add template: ${path}`);
        created.push(path);
      } catch {
        errors.push(path);
      }
    }),
  );

  return { created, errors };
}
