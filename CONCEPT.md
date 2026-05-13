# Personal Hub — Projektkonzept

**Stack**: React / Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Novel Editor · Prisma Postgres · better-auth · GitHub API

## Vision

Ein persönliches, erweiterbares System, das als zentrale Plattform für alle individualisierten Tools dient. Der Hub verbindet eine gehostete Next.js-Anwendung mit einem Obsidian Vault über Git als Sync-Layer. Das primäre Ziel: nahtlose Zusammenarbeit mit KI-Systemen (insbesondere Claude) — vom Desktop, unterwegs per Smartphone, und über die Obsidian-Oberfläche.

Der Hub wächst organisch mit. Neue Module (Zeiterfassung, Produktideen, Werdegang, ...) werden als Ordner im Vault und als Routen in der App hinzugefügt — ohne die Architektur ändern zu müssen.

---

## Kernprinzipien

1. **Markdown-First**: Alle inhaltlichen Daten leben als Markdown-Dateien mit YAML-Frontmatter. Kein proprietäres Format, kein Lock-in.
2. **Git als Source of Truth**: Ein GitHub-Repo ist die zentrale Wahrheit. Obsidian und die Web-App synchronisieren darüber.
3. **AI-Native**: Das System ist von Grund auf darauf ausgelegt, mit KI-Assistenten zu arbeiten — über MCP-Schnittstellen, strukturierte Daten und kontextreiche Beschreibungen.
4. **Erweiterbar**: Neue Module = neuer Ordner + neues Frontmatter-Schema + optionale UI-Route. Kein Refactoring nötig.
5. **Offline-fähig (Obsidian)**: Über Obsidian kann jederzeit offline gearbeitet werden. Sync passiert beim nächsten Online-Zugriff.

---

## Tech Stack

| Komponente             | Technologie                        | Zweck                                                                 |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Frontend & Backend     | **Next.js** (App Router)           | Einzige Oberfläche — UI, API Routes, MCP Server                       |
| Markdown-Editor        | **Novel** (Tiptap-basiert)         | Notion-like Editor als React-Komponente                               |
| Hosting                | **Vercel**                         | Deployment, ISR, Edge Functions                                       |
| Auth                   | **better-auth**                    | Authentifizierung, Sessions, OAuth                                    |
| ORM + Datenbank        | **Prisma Postgres**                | ORM + gehostete DB aus einem Ökosystem — Auth, Vault-Index, App-State |
| Content-Sync           | **GitHub API** (octokit)           | Lesen/Schreiben von Markdown-Dateien                                  |
| Content-Editor (lokal) | **Obsidian** + Obsidian Git Plugin | Lokaler Offline-Editor für Vault-Inhalte                              |
| AI-Schnittstelle       | **Remote MCP Server**              | Tools die Claude (mobil & desktop) aufrufen kann                      |
| Styling                | **Tailwind CSS** + **shadcn/ui**   | UI-Komponenten                                                        |

---

## Architektur

### Bestehender Obsidian Vault

Der Vault existiert bereits mit durchdachter Struktur. Die Hub-App baut darauf auf — kein Umbau nötig. Einzige Ergänzung: ein `zeiterfassung/`-Ordner und konsistentes Frontmatter wo nötig.

```
/                              → Hub-Modul
│
│
├── profile/                           → [Werdegang-Modul]
│   ├── about/                            Bio, Kontaktdaten
│   ├── education/                        Ausbildung, Zertifikate
│   ├── experience/                       Berufserfahrung, Projekte
│   ├── skills/                           Tools, Programmierung, Kompetenzen
│   ├── services/                         Angebotene Leistungen
│   ├── career/                           Lernziele, CVs, Bewerbungen
│   └── _output/                          Generierte Texte pro Plattform
│
├── clients/                           → [Kunden-Modul]
│   ├── _template/                        Template für neue Projekte
│   ├── Modulap/                          Aktive/abgeschlossene Projekte
│   └── SpecialOlympics/
│
├── zeiterfassung/                     → [Zeiterfassung-Modul] ← NEU
│   ├── 2026-05/
│   │   ├── 2026-05-01_modulap.md
│   │   └── 2026-05-02_specialolympics.md
│   └── _summary/                         Monatszusammenfassungen
│
├── ideas/                             → [Produkt-Ideen-Modul]
│   ├── project-ideas/                    Ideenlisten, Konzepte
│   ├── product-strategy/                 Plugin-Strategie, Analysen
│   ├── products/                         Produktideen mit Template
│   └── tools/                            Tool-Ideen
│
├── content/                           → [Content-Modul]
│   ├── website/                          manueleigen.de
│   ├── linkedin/                         LinkedIn-Texte
│   ├── malt/                             Malt-Profil
│   └── social-media/                     Instagram & Co.
│
├── brand/                             → [Brand-Modul]
│   ├── logo/ · colors/ · fonts/
│   ├── guidelines/                       Brand Guidelines, Schreibstil
│   └── templates/                        Branded Vorlagen
│
├── communication/                     → [Kommunikation]
│   └── CLAUDE.md                         Ton & Stil für AI-generierte Texte
│
├── ai-roles/                          → [AI-Team]
│   └── README.md                         Rollenkonzept
│
├── resources/                         → [Wissens-Modul]
│   ├── knowledge/                        Fachnotizen
│   ├── inspiration/                      Design-Inspiration
│   ├── research/                         Marktforschung
│   └── tools/                            Scripts, Automationen
│
├── TaskNotes/                         → [Task-Modul]
└── _schemas/                          ← NEU: Frontmatter-Schema-Doku
    └── README.md
```

**Schicht 2 — Datenbank (Auth + Vault-Index)**

- User-Accounts & Sessions (better-auth)
- MCP API Keys (für Claude-Zugriff)
- App-Einstellungen & Preferences
- **Vault-Index**: Frontmatter aller Markdown-Dateien als durchsuchbare JSON-Einträge (→ siehe "Vault-Index / Dataview")

### Sync-Fluss

```
Obsidian ←→ Git Push/Pull ←→ GitHub Repo ←→ GitHub API ←→ Next.js App
                                    ↓
                              Webhook → ISR Revalidation
```

**Obsidian → System**: Datei bearbeiten → Obsidian Git auto-commit → Push → Webhook → Next.js revalidiert betroffene Seiten.

**App → System**: User-Aktion oder Claude-MCP-Call → Next.js API Route → GitHub API Commit → Repo aktualisiert → Obsidian pullt beim nächsten Sync.

**Conflict Resolution**: Git übernimmt das. Bei gleichzeitigen Änderungen entsteht ein Merge-Conflict der in Obsidian aufgelöst werden kann. In der Praxis selten, da nur ein User das System nutzt.

### Drei Wege zu schreiben

Das System bietet drei gleichwertige Schreib-Zugänge auf dieselben Daten:

| Zugang                | Wann nutzen                                  | Wie es funktioniert                                        |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| **Obsidian** (lokal)  | Deep Work, offline, komplexe Texte           | Direkter Dateizugriff, Obsidian Git synct                  |
| **Hub-App** (Browser) | Unterwegs, Dashboards, Formulare, Editing    | Novel-Editor + Custom Module UIs, committet via GitHub API |
| **Claude** (MCP)      | Hands-free, mobil, Daten-Eingabe per Sprache | MCP Tools, committet via GitHub API                        |

Alle drei schreiben in dasselbe GitHub Repo → alle drei sehen sofort die Änderungen der anderen.

---

## Novel — Eingebetteter Markdown-Editor

### Was ist Novel?

Novel ist ein Notion-like Markdown-Editor als React-Komponente, basierend auf Tiptap/ProseMirror. Open Source, speziell für Next.js gebaut, mit eingebauter AI-Completion. Anders als Outstatic (ein separates CMS mit eigenen Routes und eigenem Layout) ist Novel eine **Komponente** die du in dein eigenes UI einbettest — du behältst volle Kontrolle über Layout, Navigation und Design.

### Rolle im System

Novel ist der Editor-Baustein für alle Module die Markdown-Editing brauchen. Er wird als wiederverwendbare Komponente eingesetzt — immer innerhalb deiner eigenen Pages, deinem eigenen Layout, deinem eigenen Design.

```tsx
// Vereinfachtes Beispiel
import { Editor } from "novel";

export function EntryEditor({ path, content, onSave }) {
	return (
		<div>
			<FrontmatterForm path={path} />{" "}
			{/* Custom: Frontmatter-Felder als Formular */}
			<Editor defaultValue={content} />{" "}
			{/* Novel: Notion-like Markdown-Editor */}
			<SaveButton onSave={onSave} /> {/* Custom: Commit via GitHub API */}
		</div>
	);
}
```

### Wie der GitHub-Roundtrip funktioniert

Der Editor-Flow ist ein dünner Wrapper um die GitHub API:

1. **Laden**: Route öffnen → GitHub API `getContent(path)` → base64 decode → `gray-matter` parst Frontmatter + Body → Frontmatter in Formularfelder, Body in Novel-Editor
2. **Speichern**: Formular + Editor-Inhalt → `gray-matter.stringify()` → GitHub API `createOrUpdateFileContents()` → Commit im Repo
3. **Feedback**: Obsidian Git pullt beim nächsten Sync, ISR revalidiert betroffene Pages

Das sind ca. 100-150 Zeilen Code für einen wiederverwendbaren `useGitHubFile(path)` Hook.

### Wo Novel eingesetzt wird

| Modul             | Novel-Editor?                      | Zusätzliche Custom-UI                           |
| ----------------- | ---------------------------------- | ----------------------------------------------- |
| Profile/Werdegang | Ja — für Beschreibungstexte        | Frontmatter-Formular (Typ, Periode, Tags)       |
| Produkt-Ideen     | Ja — für Beschreibung, Notizen     | Kanban-Board für Status, Frontmatter-Felder     |
| Content           | Ja — Haupteinsatz, Texte schreiben | Plattform-Auswahl, Status-Tracking              |
| Kunden            | Ja — für Projekt-Briefs            | Kunden-Übersicht, Stunden-Verknüpfung           |
| Zeiterfassung     | Nein — rein formular-basiert       | Quick-Entry, Tages-/Wochenansicht, Auswertungen |

### Vorteile gegenüber Outstatic

- **Eine Oberfläche**: Kein separates CMS mit eigenem Layout — alles ist DEIN Design
- **Volle Kontrolle**: Du bestimmst wo der Editor erscheint, wie Frontmatter dargestellt wird, welche Aktionen verfügbar sind
- **Custom Module daneben**: Zeiterfassung-Formular, Kanban-Board und Novel-Editor leben im selben Layout
- **Konsistente UX**: Einheitliche Navigation, einheitliches Auth, einheitliches Styling
- **Erweiterbar**: Tiptap-Extensions für Custom-Blöcke (z.B. Obsidian-like `[[wiki-links]]`, Callouts, etc.)

---

## Vault-Index — Dataview für die Web-App

### Problem

Dataview in Obsidian kann alle Markdown-Dateien nach Frontmatter-Feldern filtern, sortieren und aggregieren. Die Web-App braucht dasselbe: "Zeig mir alle Zeiterfassungs-Einträge für Mai, gruppiert nach Kunde, mit Stundensummen." Aber jedes Mal alle Dateien von GitHub zu fetchen und zu parsen wäre langsam und frisst Rate Limits.

### Lösung: Frontmatter-Index in PostgreSQL

Bei jedem GitHub-Webhook (Push) werden die geänderten Dateien geparst und ihr Frontmatter als JSON in die Datenbank geschrieben. Die App queried dann die DB statt GitHub.

### Prisma Schema

```prisma
model VaultEntry {
  id          String   @id @default(cuid())
  path        String   @unique   // "zeiterfassung/2026-05/2026-05-01_modulap.md"
  module      String              // "zeiterfassung" (erster Ordner im Pfad)
  slug        String              // "2026-05-01_modulap" (Dateiname ohne .md)
  frontmatter Json               // komplettes Frontmatter als JSON
  checksum    String              // SHA des GitHub-Blobs — für Diff-Detection
  indexedAt   DateTime @default(now())

  @@index([module])
  @@index([module, slug])
}
```

### Sync-Flow

```
GitHub Webhook (Push)
    ↓
/api/webhook/github (Next.js Route)
    ↓
1. Geänderte Dateien aus Webhook-Payload lesen
2. Für jede .md-Datei: GitHub API → Content holen → gray-matter parsen
3. Upsert in VaultEntry (path als unique key)
4. Gelöschte Dateien → VaultEntry löschen
5. revalidatePath() für betroffene Module
```

Initial-Sync: Beim ersten Setup oder manuell über `/api/admin/reindex` alle Dateien des Repos einmal durchlaufen und indexieren.

### Query-Beispiele

```ts
// Alle Zeiterfassungs-Einträge für Mai 2026
const entries = await prisma.vaultEntry.findMany({
	where: {
		module: "zeiterfassung",
		path: { startsWith: "zeiterfassung/2026-05/" },
	},
});

// Stunden pro Kunde im Mai
const byClient = entries.reduce((acc, e) => {
	const fm = e.frontmatter as any;
	acc[fm.project] = (acc[fm.project] || 0) + fm.hours;
	return acc;
}, {});

// Alle Produkt-Ideen mit Status "validating"
const ideas = await prisma.vaultEntry.findMany({
	where: {
		module: "ideas",
		frontmatter: { path: ["status"], equals: "validating" },
	},
});
```

Hinweis: Prisma unterstützt JSON-Queries auf PostgreSQL (`path` + `equals`/`array_contains`). Damit kannst du direkt auf Frontmatter-Felder filtern ohne alles in den Speicher zu laden.

### Was der Index kann (≈ Dataview)

| Dataview (Obsidian)                         | Vault-Index (Web-App)                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| `TABLE hours, project FROM "zeiterfassung"` | `prisma.vaultEntry.findMany({ where: { module: "zeiterfassung" } })`             |
| `WHERE status = "validating"`               | `frontmatter: { path: ["status"], equals: "validating" }`                        |
| `SORT date DESC`                            | `orderBy: { frontmatter: { path: ["date"], sort: "desc" } }` oder in-memory Sort |
| `GROUP BY project`                          | JavaScript `.reduce()` auf die Ergebnisse                                        |
| `SUM(hours)`                                | JavaScript `.reduce()` — oder raw SQL für komplexe Aggregationen                 |

### Was der Index NICHT speichert

Der Markdown-Body wird nicht in der DB gespeichert — nur das Frontmatter. Für den vollen Inhalt (z.B. im Novel-Editor) holt die App die Datei on-demand von GitHub. Das hält den Index schlank und die DB klein.

---

## MCP Server (Claude-Schnittstelle)

Der MCP Server ist ein Endpunkt in der Next.js App, der Claude (mobil & desktop) Tools bereitstellt. Claude kann diese Tools aufrufen, wenn es Zugriff über ein Project mit konfigurierter Integration hat.

### Authentifizierung

Der MCP Server prüft bei jedem Request einen API-Key, der in der Hub-Datenbank gespeichert ist. Nur authentifizierte Anfragen (von Claude-Projekten mit korrektem Key) werden akzeptiert.

### Tools

**Kern-Tools (modulübergreifend)**

| Tool                                      | Beschreibung                                        |
| ----------------------------------------- | --------------------------------------------------- |
| `list_modules`                            | Alle verfügbaren Module und ihre Schemas auflisten  |
| `list_entries(module, filter?)`           | Einträge eines Moduls auflisten, optional gefiltert |
| `get_entry(module, slug)`                 | Einen Eintrag lesen (Frontmatter + Content)         |
| `create_entry(module, frontmatter, body)` | Neuen Eintrag erstellen                             |
| `update_entry(module, slug, changes)`     | Bestehenden Eintrag aktualisieren                   |
| `search(query)`                           | Volltextsuche über alle Module                      |

**Modul-spezifische Tools**

| Tool                                                     | Beschreibung                                  |
| -------------------------------------------------------- | --------------------------------------------- |
| `log_hours(date, project, hours, description)`           | Arbeitsstunden erfassen → `zeiterfassung/`    |
| `add_product_idea(title, category, description, status)` | Neue Produktidee → `ideas/products/`          |
| `update_profile(section, content)`                       | Profil aktualisieren → `profile/`             |
| `add_client(name)`                                       | Neues Kundenprojekt aus Template → `clients/` |
| `draft_content(platform, topic)`                         | Content-Entwurf → `content/[platform]/`       |

### System Prompt für Claude Project

```
Du bist M's persönlicher Assistent mit Zugriff auf den Personal Hub.
M ist Creative Developer & Graphic Designer, Freelancer in Berlin.

Verfügbare Module und ihre Vault-Pfade:

## Zeiterfassung → zeiterfassung/YYYY-MM/YYYY-MM-DD_projekt-slug.md
Felder: date, project, hours, description, billable, rate, tags

## Produkt-Ideen → ideas/products/
Felder: title, category (SaaS|Template|Course|Tool|Other), status (idea|validating|building|launched|parked), target_audience, potential_revenue, effort_estimate, priority, tags

## Profil/Werdegang → profile/ (Unterordner: about, experience, skills, services, education, career)
Felder je nach Typ: type (station|skill|service), title, period, company, role, highlights, level, category, tags

## Kunden → clients/[name]/ (aus _template kopieren)
Felder: client, project_type, status, start_date, tags

## Content → content/[platform]/
Plattformen: website, linkedin, malt, social-media

## Ressourcen → resources/ (knowledge, inspiration, research, tools)

Regeln:
- Frage nach fehlenden Pflichtfeldern bevor du schreibst
- Bestätige die Aktion bevor du sie ausführst
- Bei Zeiterfassung: wenn kein Datum angegeben, nutze heute
- Nutze den Ton aus communication/CLAUDE.md
- Beziehe dich auf bestehende Kunden/Projekte wenn möglich
```

---

## Module

### 1. Zeiterfassung (NEU — einziger neuer Ordner)

**Zweck**: Arbeitsstunden als Freelancer erfassen und auswerten. Verlinkt mit bestehenden Kunden aus `clients/`.

**Vault-Pfad**: `zeiterfassung/YYYY-MM/YYYY-MM-DD_projekt-slug.md`

**Frontmatter-Schema:**

```yaml
---
date: "2026-05-06"
project: "Modulap" # ← muss client-Ordner in clients/ matchen
task: "Konfigurator Icons"
hours: 4.5
description: "Icon-Set finalisiert, Exportvarianten erstellt"
billable: true
rate: 85
tags: [design, icons, modulap]
---
```

**Features in der Web-App:** Tages-/Wochenansicht, Projekt-Filter, Monatssummen (hours × rate), Quick-Entry

**Claude-Nutzung:**

- "Trag 3 Stunden für Modulap ein, Icons finalisiert"
- "Wie viele Stunden hab ich diese Woche gearbeitet?"
- "Zeig mir alle unbilled Hours für Mai"

---

### 2. Produkt-Ideen (BESTEHT — `ideas/`)

**Zweck**: Ideen für digitale Produkte sammeln, bewerten und verwalten. Ordner-Struktur bleibt wie sie ist (`project-ideas/`, `products/`, `product-strategy/`, `tools/`).

**Frontmatter ergänzen** in `ideas/products/`-Dateien:

```yaml
---
title: "Figma-to-Code Template Pack"
category: "Template"
status: "validating"
target_audience: "Freelance Designer die auch coden"
potential_revenue: "einmalig, 29-49€"
effort_estimate: "2 Wochen"
priority: "high"
created: "2026-05-06"
updated: "2026-05-06"
tags: [figma, templates, design-to-code]
---
```

**Features in der Web-App:** Kanban-Board (status als Spalten), Detail-View mit Markdown-Rendering, Quick-Add

**Claude-Nutzung:**

- "Neue Produktidee: ein Notion-Template-Pack für Freelancer"
- "Verschieb die Figma-Templates-Idee auf building"

---

### 3. Profil / Werdegang (BESTEHT — `profile/`)

**Zweck**: Die bestehende `profile/`-Struktur (about, experience, skills, services, education, career, \_output) ist bereits die Single Source of Truth für den Werdegang. Dient drei Zwecken:

1. Persönliche Referenz und Reflexion
2. Background-Context für KI (über `_context/MANO-CONTEXT.md` + `profile/`)
3. Content-Quelle für die Website (via API an Strapi)

**Frontmatter ergänzen** wo nötig, z.B. in `profile/experience/`:

```yaml
---
type: "station"
title: "Senior Designer bei Agentur Y"
period: "2022-2024"
company: "Agentur Y"
role: "Senior Graphic Designer"
highlights:
  - "Lead Designer für 12 Branding-Projekte"
  - "Design System aufgebaut"
tags: [design, branding, leadership]
---
```

**Content-Pipeline zur Website:**
Die Hub-App bietet `/api/public/career` als JSON-Endpunkt. Die Website (Strapi + Next.js) fetcht diese Daten periodisch oder per Webhook.

```
Vault → Git Push → GitHub Repo
                                ↓
                          Hub App API → /api/public/career
                                            ↓
                                  Website Strapi (fetch & cache)
                                            ↓
                                  manueleigen.de Frontend
```

---

### 4. Kunden (BESTEHT — `clients/`)

**Zweck**: Kundenprojekte verwalten. Template-System (`clients/_template/`) existiert bereits. Die Hub-App bietet eine Übersicht und verlinkt mit Zeiterfassung.

**Features in der Web-App:** Kunden-Übersicht mit Status, Verknüpfung mit Zeiterfassungs-Einträgen (summierte Stunden pro Kunde), Projekt-Detailseiten

---

### 5. Content (BESTEHT — `content/`)

**Zweck**: Plattform-Content für Website, LinkedIn, Malt, Social Media. Write once, publish everywhere.

**Features in der Web-App:** Content-Übersicht nach Plattform, Novel-Editor zum Schreiben/Bearbeiten, Status-Tracking (draft → review → published)

---

## Erweiterbarkeit

### Neues Modul hinzufügen — Checkliste

1. **Vault**: Neuen Ordner anlegen (z.B. `finanzen/`)
2. **Schema**: Frontmatter-Schema in `_schemas/` dokumentieren
3. **Template**: Obsidian-Template in `_templates/` anlegen
4. **App**: Neue Route `/app/finanzen` + API-Routen
5. **MCP**: Tool-Definitionen im MCP Server ergänzen
6. **Claude**: System Prompt im Project aktualisieren

### Mögliche zukünftige Module

- **Finanzen** — Einnahmen/Ausgaben, Steuerschätzungen, Rechnungserstellung
- **Lern-Tracker** — Kurse, Bücher, Zertifikate (ergänzt `profile/education/`)
- **Content-Kalender** — Redaktionsplan über `content/`-Plattformen hinweg
- **Gesundheit/Habits** — Tracking persönlicher Gewohnheiten
- **Bookmarks/Resources** — Erweitert `resources/` mit Tagging und Suche
- **Brand-Dashboard** — Live-Übersicht über Brand-Assets aus `brand/`

### Future Power Features

**Vercel AI SDK — AI direkt in der App**
Provider-agnostisch (Claude, Gemini, Ollama/lokal, Groq). Ermöglicht: Chat-Widget das den Vault-Context kennt, AI-gestützte Wochenzusammenfassungen, automatische Content-Drafts, "frag deine Daten" im Browser, strukturierte Outputs via `generateObject()`. Kostenlose Nutzung möglich über Ollama (lokal) oder Groq Free Tier; Claude API für anspruchsvolle Tasks (wenige Cent pro Gespräch).

**Command Palette (cmdk) — Cmd+K für alles**
Dateien suchen, Module wechseln, Stunden eintragen, neue Idee anlegen — alles per Tastatur. Nutzt shadcn/ui's eingebaute Command-Komponente.

**TanStack Table — Dataview auf Steroiden**
Headless Table-Komponente: sortierbar, filterbar, gruppierbar, paginierbar. Für alle Datenansichten (Zeiterfassung, Kunden, Ideen). Zusammen mit dem Vault-Index das Web-Pendant zu Dataview.

**Tiptap Pro Table — Sortierbare Tabellen im Editor**
Spalten-Sortierung (A-Z/Z-A), Drag-Handles für Zeilen/Spalten, Cell-Merging. Erweitert den Novel-Editor um Power-Tabellen direkt im Markdown.

**PWA (Progressive Web App) — App auf dem Homescreen**
Next.js App als installierbare Mobile-App via `next-pwa`. Kein App Store, ein Icon auf dem Homescreen, fühlt sich nativ an.

**Recharts / Chart.js — Daten-Visualisierungen**
Stunden pro Woche als Balkendiagramm, Umsatzentwicklung, Ideenpipeline-Trichter. Daten kommen aus dem Vault-Index.

**React Email + Resend — Automatisierte Emails**
Wochenreport an dich selbst, Rechnungs-Drafts, Erinnerungen. Resend Free Tier: 3.000 Emails/Monat.

**Vercel Cron Jobs — Geplante Automationen**
"Jeden Montag 9 Uhr → AI generiert Wochenzusammenfassung aus Zeiterfassung → legt sie als Markdown im Vault ab." Oder: täglicher Reminder für fehlende Stundeneinträge.

---

## Authentifizierung & Sicherheit

### better-auth Setup

- Email/Password Login (für dich als Single User)
- Optional: Magic Link oder OAuth (Google)
- Session-basierte Auth mit Cookies
- Middleware schützt alle `/app/*` und `/api/*` Routen

### MCP-Zugriff

- Eigener API Key pro Claude-Project
- Keys werden in der DB gespeichert und über die Hub-UI verwaltet
- Rate Limiting auf MCP-Endpunkt
- Alle MCP-Calls werden geloggt (wer, wann, welches Tool, welche Daten)

### Prisma Schema (Auth & App)

```prisma
// === Auth (better-auth managed) ===
// better-auth bringt eigene Tabellen mit (user, session, account, verification).
// Diese werden über den Prisma Adapter automatisch verwaltet.

// === App-spezifisch ===

model ApiKey {
  id          String   @id @default(cuid())
  userId      String
  name        String           // z.B. "Claude Mobile Project"
  key         String   @unique
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  permissions String[] @default(["read", "write"])
  auditLogs   AuditLog[]
}

model AuditLog {
  id        String   @id @default(cuid())
  apiKeyId  String?
  apiKey    ApiKey?  @relation(fields: [apiKeyId], references: [id])
  tool      String           // z.B. "log_hours"
  input     Json
  result    String           // "success" | "error"
  createdAt DateTime @default(now())
}

// === Vault-Index (Dataview-Ersatz) ===

model VaultEntry {
  id          String   @id @default(cuid())
  path        String   @unique   // "zeiterfassung/2026-05/2026-05-01_modulap.md"
  module      String              // "zeiterfassung"
  slug        String              // "2026-05-01_modulap"
  frontmatter Json               // komplettes Frontmatter als JSON
  checksum    String              // SHA des GitHub-Blobs
  indexedAt   DateTime @default(now())

  @@index([module])
  @@index([module, slug])
}
```

---

## Hosting & Deployment

| Service             | Nutzung                    | Kosten                                   |
| ------------------- | -------------------------- | ---------------------------------------- |
| **Vercel**          | Next.js Hosting, Edge, ISR | Free Tier ausreichend                    |
| **GitHub**          | Repo, API, Webhooks        | Free                                     |
| **Prisma Postgres** | Datenbank (ORM + Hosting)  | Free Tier                                |
| **Obsidian**        | Lokaler Editor             | Kostenlos (Sync nicht nötig, Git reicht) |

### Deployment-Flow

```
Code-Änderungen → Push to main → Vercel auto-deploy
Content-Änderungen → Push to vault-repo → Webhook → ISR revalidate (kein Deploy)
```

Es gibt zwei separate Repos:

1. **App-Repo**: Next.js Code, Prisma Schema, MCP Server
2. **Vault-Repo**: Markdown-Dateien (Content), wird von Obsidian und der App genutzt

---

## Roadmap

### Phase 1 — Foundation (Woche 1-2)

- [ ] Next.js Projekt aufsetzen (App Router, Tailwind, shadcn/ui)
- [ ] Prisma Postgres Setup (prisma.io)
- [ ] better-auth Integration
- [ ] `zeiterfassung/` Ordner + `_schemas/` Ordner zum Vault hinzufügen
- [ ] GitHub API Service: `useGitHubFile(path)` Hook (laden, speichern, listen)
- [ ] Webhook-Endpoint für ISR Revalidation + Vault-Index Sync
- [ ] VaultEntry Prisma Model + Initial-Reindex Route (`/api/admin/reindex`)
- [ ] Novel-Editor Komponente einbinden + Markdown↔Editor Konvertierung
- [ ] Wiederverwendbare `<EntryEditor>` Komponente (Frontmatter-Form + Novel + Save)

### Phase 2 — Erstes Modul: Zeiterfassung (Woche 2-3)

- [ ] Frontmatter-Schema definieren
- [ ] Obsidian Template erstellen
- [ ] Quick-Entry Formular (kein Novel — reines Formular)
- [ ] Tages-/Wochenansicht (verlinkt mit clients/)
- [ ] Auswertungen (Monat, Projekt, Kunde)

### Phase 3 — MCP Server (Woche 3-4)

- [ ] Remote MCP Endpoint implementieren
- [ ] Core Tools: list/get/create/update
- [ ] Modul-spezifische Tools (log_hours etc.)
- [ ] API Key Management UI
- [ ] Audit Logging
- [ ] Claude Project einrichten und testen

### Phase 4 — Weitere Module (Woche 4-6)

- [ ] Produkt-Ideen: Kanban-Board + Novel für Detail-Editing
- [ ] Werdegang: Listenansicht + Novel-Editor für profile/\* Dateien
- [ ] Content: Plattform-Übersicht + Novel als Schreib-Editor
- [ ] Content-Pipeline API für Website (→ Strapi)
- [ ] MCP Tools für neue Module ergänzen

### Phase 5 — Polish & Iterate (fortlaufend)

- [ ] Dashboard / Übersichtsseite
- [ ] Mobile-optimierte Views (Novel ist mobile-ready)
- [ ] Tiptap-Extensions: Wiki-Links, Callouts, Custom Blöcke
- [ ] Neue Module nach Bedarf
- [ ] Performance-Optimierung (Caching, GitHub API Limits)

---

## Offene Entscheidungen

1. **MCP Auth**: Einfacher API Key vs. OAuth — API Key reicht für Single User
2. **Content-Pipeline zur Website**: Webhook (Push) vs. Cron-Fetch (Pull) — Webhook ist eleganter
3. **Zwei Repos**: App-Repo (Next.js Code) + Vault-Repo (MeHub) — separate Git-Zyklen
4. **Frontmatter-Migration**: Bestehende Dateien im Vault schrittweise mit Frontmatter anreichern vs. Big-Bang
