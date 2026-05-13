# AGENTS.md — AI Collaboration Guide (Vault)

Instructions for Claude and other AI agents interacting with this vault.

---

## Context First

Before doing anything, call `get_context` to load `_context/MANO-CONTEXT.md`. This gives you the full background on who Manuel is, what he's working on, and how the system fits together.

Also read `communication/CLAUDE.md` for tone and style. These rules apply to everything you write — in German or English.

---

## What This Vault Is

This is my personal knowledge vault — the content layer of the **MeHub** personal hub system. You access it through an MCP server built into the MeHub App, which reads and writes files here via the GitHub API.

Every folder is a module. Every module has a consistent frontmatter schema. You write Markdown files, not database rows.

---

## Modules and Vault Paths

| Module              | Path pattern                                       | What lives here                   |
| ------------------- | -------------------------------------------------- | --------------------------------- |
| Time tracking       | `zeiterfassung/YYYY-MM/YYYY-MM-DD_projekt-slug.md` | Daily time entries                |
| Product ideas       | `ideas/products/[slug].md`                         | Structured idea cards             |
| Profile / career    | `profile/[section]/[slug].md`                      | Work history, skills, services    |
| Clients             | `clients/[Name]/[slug].md`                         | Client project files              |
| Content             | `content/[platform]/[slug].md`                     | Platform content drafts           |
| AI context          | `_context/MANO-CONTEXT.md`                         | Your master background context    |
| Communication style | `communication/CLAUDE.md`                          | Tone and style for generated text |
| AI roles            | `ai-roles/README.md`                               | Role definitions for AI personas  |

---

## Frontmatter Schemas

### zeiterfassung

```yaml
date: "YYYY-MM-DD"
project: "" # must match an existing folder name under clients/
task: "" # short task label
hours: 0.0
description: "" # what was done
billable: true
rate: 85 # hourly rate in EUR — always confirm if unsure
tags: []
```

### ideas/products

```yaml
title: ""
category: "" # SaaS | Template | Course | Tool | Other
status: "" # idea | validating | building | launched | parked
target_audience: ""
potential_revenue: ""
effort_estimate: ""
priority: "" # high | medium | low
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
tags: []
```

### profile/experience (type: station)

```yaml
type: "station"
title: ""
period: "YYYY-YYYY"
company: ""
role: ""
highlights: []
tags: []
```

### profile/skills (type: skill)

```yaml
type: "skill"
title: ""
category: "" # Design | Development | Strategy | Tools
level: "" # expert | advanced | intermediate | beginner
tags: []
```

### clients

```yaml
client: ""
project_type: ""
status: "" # active | completed | paused
start_date: "YYYY-MM-DD"
tags: []
```

---

## Rules

1. **Confirm before writing** — before creating or updating any file, show the full content you're about to write and wait for explicit confirmation. No silent writes.
2. **Use existing client names** — check `clients/` for exact folder names. Never invent a project or client slug.
3. **Date defaults** — if no date is specified for a time entry, use today's date.
4. **Required fields first** — if a required field is missing (e.g. `project` for time tracking, `category` for ideas), ask for it before proceeding.
5. **Rate field** — never guess the hourly rate. Ask if not provided.
6. **Language** — follow the language of the input. German for personal notes, English for code-facing content. Route slugs and file names always stay German (e.g. `zeiterfassung`, `kunden`).
7. **No invented content** — never fill guessed values. A partial entry is better than a wrong one.
8. **Tone** — follow `communication/CLAUDE.md`. Professional, direct, no corporate filler.

---

## Available MCP Tools

These tools are provided by the MeHub MCP server:

| Tool                                                     | What it does                                      |
| -------------------------------------------------------- | ------------------------------------------------- |
| `get_context`                                            | Load `_context/MANO-CONTEXT.md` (call this first) |
| `list_modules`                                           | List all modules and their schemas                |
| `list_entries(module, filter?)`                          | List entries in a module, optionally filtered     |
| `get_entry(module, slug)`                                | Read a single entry (frontmatter + body)          |
| `create_entry(module, frontmatter, body)`                | Create a new entry                                |
| `update_entry(module, slug, changes)`                    | Update an existing entry                          |
| `search(query)`                                          | Full-text search across all modules               |
| `log_hours(date, project, hours, description)`           | Quick-create a time entry                         |
| `add_product_idea(title, category, description, status)` | Quick-create a product idea                       |
| `update_profile(section, content)`                       | Update a profile section                          |
| `add_client(name)`                                       | Create a new client from the template             |
| `draft_content(platform, topic)`                         | Draft platform content                            |

---

## Claude Project — System Prompt

Use this as the system prompt when configuring a Claude Project connected to the MeHub MCP server:

```
Du bist M's persönlicher Assistent mit Zugriff auf den MeHub Personal Hub.
M ist Creative Developer & Graphic Designer, Freelancer in Berlin.

Lies bei Sessionstart den vollen Context über get_context (MANO-CONTEXT.md).
Beachte den Kommunikationsstil aus communication/CLAUDE.md.

Verfügbare Module und ihre Vault-Pfade:

## Zeiterfassung → zeiterfassung/YYYY-MM/YYYY-MM-DD_projekt-slug.md
Felder: date, project, hours, task, description, billable, rate, tags

## Produkt-Ideen → ideas/products/[slug].md
Felder: title, category (SaaS|Template|Course|Tool|Other),
        status (idea|validating|building|launched|parked),
        target_audience, potential_revenue, effort_estimate, priority, tags

## Profil/Werdegang → profile/[section]/[slug].md
Sektionen: about, experience, skills, services, education, career, _output

## Kunden → clients/[Name]/[slug].md

## Content → content/[platform]/[slug].md
Plattformen: website, linkedin, malt, social-media

Regeln:
- Lade MANO-CONTEXT.md am Anfang jeder Session
- Frage nach fehlenden Pflichtfeldern bevor du schreibst
- Bestätige jeden Schreibvorgang bevor du ihn ausführst
- Bei Zeiterfassung: wenn kein Datum angegeben, nutze heute
- Nutze den Ton aus communication/CLAUDE.md
- Beziehe dich auf bestehende Kunden/Projekte (check clients/ folder)
```

---

## Important Files for AI Context

| File                       | When to read                                                  |
| -------------------------- | ------------------------------------------------------------- |
| `_context/MANO-CONTEXT.md` | Start of every session — master background                    |
| `_context/strategy.md`     | When discussing positioning, direction, or business decisions |
| `communication/CLAUDE.md`  | When generating any text that will be used or published       |
| `ai-roles/README.md`       | When switching into a specific AI persona or role             |
| `clients/_template/`       | When creating a new client project                            |
