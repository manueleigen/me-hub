# DOCUMENTATION.md — Technical Reference

---

## Project Structure

```
.
├── app/
│   ├── (auth)/                  # Public routes (no auth required)
│   │   ├── layout.tsx
│   │   └── login/
│   ├── (dashboard)/             # Protected routes (auth required)
│   │   ├── kunden/              # Clients module
│   │   ├── produkt-ideen/       # Product ideas (Kanban)
│   │   ├── profil/              # Profile / career
│   │   ├── settings/
│   │   ├── vault/               # Vault file browser
│   │   ├── zeiterfassung/       # Time tracking
│   │   ├── layout.tsx           # Dashboard shell (sidebar + header)
│   │   └── page.tsx             # Dashboard home
│   ├── api/
│   │   └── auth/                # better-auth route handler
│   └── generated/
│       └── prisma/              # Auto-generated Prisma client (do not edit)
├── components/
│   ├── dashboard/               # Dashboard-specific components
│   ├── editor/                  # Novel editor + Tiptap extensions
│   ├── kunden/                  # Client list components
│   ├── layout/                  # App shell (sidebar, header)
│   ├── produkt-ideen/           # Kanban board, idea dialogs
│   ├── ui/                      # shadcn/ui primitives
│   ├── vault/                   # Vault viewer, tree, sidebar
│   └── zeiterfassung/           # Time entry components
├── hooks/                       # Shared React hooks
├── lib/
│   ├── auth.ts                  # Server-side auth (getAuthSession)
│   ├── auth-client.ts           # Client-side auth (authClient)
│   ├── config.ts                # Feature flags + app config
│   ├── prisma.ts                # Prisma singleton
│   ├── utils.ts                 # cn() and other shared utils
│   ├── kunden/                  # Client types + mock data
│   ├── produkt-ideen/           # Idea types + mock data
│   ├── vault/                   # Vault service + types + mock data
│   └── zeiterfassung/           # Time entry types + mock data
├── prisma/
│   ├── migrations/              # Applied DB migrations
│   └── schema.prisma            # Source of truth for DB schema
├── public/                      # Static assets
├── styles/                      # Global CSS (Tailwind base)
├── types/                       # Shared TypeScript types
├── middleware.ts                 # Auth-gating middleware
├── next.config.mjs
├── prisma.config.ts
├── tsconfig.json
├── AGENTS.md                    # AI collaboration guide
├── CONCEPT.md                   # Product vision
├── DECISIONS.md                 # Architectural decisions log
└── DOCUMENTATION.md             # This file
```

---

## Tech Stack

| Technology | Version | Official Docs |
|---|---|---|
| Next.js (App Router) | ^16.2.5 | https://nextjs.org/docs |
| React | ^19.2.4 | https://react.dev |
| TypeScript | ^5.9.3 | https://www.typescriptlang.org/docs |
| Tailwind CSS v4 | ^4.1.18 | https://tailwindcss.com/docs |
| shadcn/ui | latest | https://ui.shadcn.com |
| Novel (rich text editor) | ^1.0.2 | https://novel.sh/docs |
| Prisma ORM | ^7.8.0 | https://www.prisma.io/docs |
| PostgreSQL (Prisma Postgres) | — | https://www.prisma.io/postgres |
| better-auth | ^1.6.9 | https://www.better-auth.com/docs |
| Recharts | 2.15.4 | https://recharts.org/en-US/api |
| date-fns | 4.1.0 | https://date-fns.org/docs |
| Vercel (hosting) | — | https://vercel.com/docs |

---

## Database Schema Overview

Defined in [prisma/schema.prisma](prisma/schema.prisma). Models:

| Model | Purpose |
|---|---|
| `User` | Single user account |
| `Session` / `Account` / `Verification` | better-auth managed tables |
| `VaultIndex` | Indexed Markdown file metadata (path, frontmatter, SHA) |
| `TimeEntry` | Time tracking records (date, duration in minutes, project, client, tags) |
| `ProductIdea` | Product idea cards (title, status, category, priority) |
| `Client` | Client records (name, slug, hourly rate) |
| `Project` | Project records linked to clients |

> **Note**: The schema diverges slightly from CONCEPT.md's planned schema — `VaultEntry` was implemented as `VaultIndex`, and `ApiKey` / `AuditLog` models from the MCP plan are not yet added. Do not change the schema without checking DECISIONS.md first.

---

## Feature Flags

All flags live in [lib/config.ts](lib/config.ts):

| Flag | Default | Meaning |
|---|---|---|
| `auth` | `true` | Auth is active; middleware enforces login |
| `githubSync` | `false` | GitHub API sync disabled; all modules use mock data |
| `editing` | `true` | Vault file editing allowed (mock save only) |
| `timeTracking` | `true` | Time tracking module enabled |
| `productIdeas` | `true` | Product ideas module enabled |

---

## Current State

### Working

- **Authentication** — better-auth with GitHub OAuth only (email/password removed). No Prisma adapter active — sessions are held in better-auth's in-memory store and do not persist across server restarts. Middleware redirects unauthenticated users to `/login`. Session available server-side via `getAuthSession()`, client-side via `authClient` from `lib/auth-client.ts`.
- **Dashboard shell** — sidebar navigation, header, theme switching (next-themes).
- **Vault module** — file tree browser, markdown rendering, Novel editor with Tiptap extensions and slash commands. Mock data from `lib/vault/mock-data.ts`.
- **Time tracking (Zeiterfassung)** — week/month views, quick-entry form, time entry list. Mock data only.
- **Product ideas (Produkt-Ideen)** — Kanban board (status columns), new idea dialog, idea detail dialog. Mock data only.
- **Clients (Kunden)** — client list view, client detail page. Mock data only. Known bug: list only refreshes on full page reload.
- **Database** — Prisma schema migrated (`prisma/migrations/20260509071552_init`). All models are queryable; no module UI is wired to the DB yet.
- **Server Actions** — action files exist under `app/actions/` for vault, zeiterfassung, produkt-ideen, clients, projects, and github. Not fully wired to UI.

### Not Yet Implemented

- **GitHub sync** — `features.githubSync` is `false`. `lib/github.ts` has the Octokit client stub; `lib/vault/index.ts` has TODO stubs. No end-to-end read/write flow is active.
- **Webhook endpoint** — `/api/webhook/github` does not exist. ISR revalidation via push webhook is planned but absent.
- **MCP server** — planned in CONCEPT.md; no API route exists yet. `ApiKey` and `AuditLog` Prisma models are not in the schema.
- **DB-backed modules** — all module UIs read from `lib/*/mock-data.ts`, not from the database.
- **Profile / Werdegang module** — route exists (`/profil`) but content is a placeholder.
- **Content module** — not started.
- **Initial vault reindex** — `/api/admin/reindex` is not implemented.
- **Persistent auth sessions** — in-memory only (no Prisma adapter in `lib/auth.ts`). The `Session`, `Account`, and `Verification` DB tables exist but are unused by better-auth. Re-add the adapter when persistent login across restarts is needed.
