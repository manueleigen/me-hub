# MeHub Vault

Personal knowledge vault and content layer — Freelance Creative Developer & Graphic Designer.

---

## What is this?

This repository contains all personal work content, knowledge, and creative output as plain Markdown files with YAML frontmatter. Three principles:

1. **Markdown-First** — all data lives as human-readable `.md` files. No proprietary formats, no lock-in.
2. **Git as Source of Truth** — this repo is the single source of truth, synced across all surfaces via Git.
3. **AI-Native** — the folder structure is designed for AI collaboration. Every module has a consistent frontmatter schema that Claude can read and write reliably.

---

## Larger Context

This vault is the **content layer** of a larger personal hub system called **MeHub**:

```
Obsidian (local editor, offline)
        ↕  Obsidian Git plugin
  GitHub Vault Repo  ←  you are here
        ↕  GitHub API
  MeHub App (Next.js web app)
        ↕  Remote MCP Server
  Claude (AI assistant — mobile, desktop, web)
```

The **MeHub App** (separate repository) is a hosted Next.js app that reads and writes to this vault via the GitHub API. It provides dashboards, module UIs (Kanban boards, time tracking views, a vault browser), and a Remote MCP server that Claude uses to access vault data.

All three surfaces — Obsidian, the web app, and Claude — write to the same Git repo. They are always in sync.

→ See the [MeHub App repository](https://github.com/manueleigen/mehub) for the full system architecture.

---

## Folder Structure

Each top-level folder is a **module** — a self-contained domain of work or knowledge with its own frontmatter schema.

```
/
├── _context/               → AI context layer
│   ├── MANO-CONTEXT.md       Master context — loaded by Claude at session start
│   └── strategy.md           Positioning, direction, business strategy
│
├── _schemas/               → Frontmatter schema documentation per module
│
├── profile/                → Career module (single source of truth for CV/bio)
│   ├── about/                Bio, contact details
│   ├── education/            Degrees, certifications
│   ├── experience/           Work history, client projects
│   ├── skills/               Tools, programming, competencies
│   ├── services/             Offered services
│   ├── career/               Goals, CVs, applications
│   └── _output/              AI-generated platform texts (website, Malt, LinkedIn)
│
├── clients/                → Clients module
│   ├── _template/            Template for new client projects
│   ├── Modulap/
│   └── SpecialOlympics/
│
├── zeiterfassung/          → Time tracking module  [new folder]
│   ├── 2026-05/
│   │   ├── 2026-05-01_modulap.md
│   │   └── 2026-05-02_specialolympics.md
│   └── _summary/             Monthly summaries
│
├── ideas/                  → Product ideas module
│   ├── project-ideas/        Raw ideas, brainstorms
│   ├── product-strategy/     Plugin strategy, market analysis
│   ├── products/             Structured idea cards with frontmatter
│   └── tools/                Tool ideas
│
├── content/                → Content module (write once, publish everywhere)
│   ├── website/              manueleigen.de
│   ├── linkedin/
│   ├── malt/
│   └── social-media/
│
├── brand/                  → Brand assets and guidelines
│   ├── logo/ · colors/ · fonts/
│   ├── guidelines/           Brand guidelines, writing style
│   └── templates/            Branded templates
│
├── communication/          → Communication guidelines for AI
│   └── CLAUDE.md             Tone & style for all AI-generated texts
│
├── ai-roles/               → AI team role definitions
│   └── README.md
│
├── resources/              → Knowledge base
│   ├── knowledge/            Domain notes, references
│   ├── inspiration/          Design inspiration
│   ├── research/             Market research
│   └── tools/                Scripts, automations
│
└── TaskNotes/              → Task and project notes
```

---

## Frontmatter Schemas

Schemas are documented in full under `_schemas/`. Quick reference:

### zeiterfassung — time entries

**Path**: `zeiterfassung/YYYY-MM/YYYY-MM-DD_projekt-slug.md`

```yaml
---
date: "2026-05-06"
project: "Modulap" # must match a folder name in clients/
task: "Konfigurator Icons"
hours: 4.5
description: "Icon-Set finalisiert, Exportvarianten erstellt"
billable: true
rate: 85
tags: [design, icons, modulap]
---
```

### ideas/products — product ideas

**Path**: `ideas/products/[title-slug].md`

```yaml
---
title: "Figma-to-Code Template Pack"
category: "Template" # SaaS | Template | Course | Tool | Other
status: "validating" # idea | validating | building | launched | parked
target_audience: "Freelance Designer die auch coden"
potential_revenue: "einmalig, 29-49€"
effort_estimate: "2 Wochen"
priority: "high" # high | medium | low
created: "2026-05-06"
updated: "2026-05-06"
tags: [figma, templates, design-to-code]
---
```

### profile/experience — career stations

**Path**: `profile/experience/[slug].md`

```yaml
---
type: "station" # station | skill | service
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

### clients — client projects

**Path**: `clients/[Name]/[slug].md` (copy `clients/_template/` for new clients)

```yaml
---
client: "Modulap"
project_type: "Product Design"
status: "active" # active | completed | paused
start_date: "2026-01-01"
tags: [product, design, react]
---
```

---

## Three Ways to Write

| Surface                 | When to use                                | How it works                                      |
| ----------------------- | ------------------------------------------ | ------------------------------------------------- |
| **Obsidian** (local)    | Deep work, offline, long-form writing      | Direct file access — Obsidian Git syncs on commit |
| **MeHub App** (browser) | Dashboards, quick entry, editing on the go | Novel editor + module UIs, commits via GitHub API |
| **Claude** (MCP)        | Hands-free, mobile, voice input            | MCP tools, commits via GitHub API                 |

All three write to this repo. All three stay in sync.

---

## Setup with Obsidian

1. Clone this repo to your local machine
2. Open the folder as an Obsidian vault (File → Open Folder as Vault)
3. Install the [Obsidian Git](https://github.com/denolehov/obsidian-git) community plugin
4. Configure auto-commit interval and push on sync

No special Obsidian plugins are required for reading — the folder structure and plain Markdown work out of the box.

---

## Notes

This vault is a personal system, not intended for contributions. If you're building something similar, feel free to use the folder structure and frontmatter schemas as a reference.
