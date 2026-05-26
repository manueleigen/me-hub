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
│   │   ├── template.tsx         # VaultSyncProvider + AppStatusIndicator
│   │   ├── aufgaben/            # Task management (Kanban)
│   │   ├── clients/             # Client management + detail pages (/clients/[slug])
│   │   ├── kunden/              # Legacy client list (kept; superseded by /clients)
│   │   ├── produkt-ideen/       # Product ideas (Kanban)
│   │   ├── profil/              # Profile / career + vault settings
│   │   ├── projects/            # Portfolio projects
│   │   ├── settings/
│   │   ├── vault/               # Vault file browser
│   │   ├── zeiterfassung/       # Time tracking (list + manual entry)
│   │   ├── zeiterfassung2/      # Time tracking v2 (donut timer + sessions UI)
│   │   ├── layout.tsx           # Dashboard shell (sidebar + header)
│   │   └── page.tsx             # Dashboard home
│   ├── actions/                 # Server actions per module
│   │   ├── aufgaben.ts          # listTasks, saveTask, deleteTask, updateTaskStatus
│   │   ├── clients.ts           # listClients, saveClient, deleteClient
│   │   ├── github.ts            # createOrUpdateGitHubFile, deleteGitHubFile
│   │   ├── produkt-ideen.ts
│   │   ├── projects.ts          # listProjects, saveProject, deleteProject
│   │   ├── settings.ts
│   │   ├── setup.ts
│   │   ├── vault-sync.ts        # checkVaultRemote, executeVaultSync, getVaultSyncSnapshot
│   │   ├── vault.ts
│   │   └── zeiterfassung.ts
│   ├── api/
│   │   ├── auth/                # better-auth route handler
│   │   └── webhook/github/      # GitHub push → vault mirror sync
│   └── generated/
│       └── prisma/              # Auto-generated Prisma client (do not edit)
├── components/
│   ├── aufgaben/                # AufgabenView, TaskDialog, TaskKanbanCard
│   ├── clients/                 # ClientCard, ClientQuickDetailDrawer, client-detail-view (page)
│   ├── dashboard/               # Dashboard-specific components
│   ├── editor/                  # Novel editor + Tiptap extensions
│   ├── kanban-board.tsx         # Generic Kanban board primitive
│   ├── kunden/                  # Legacy client list components
│   ├── layout/                  # App shell, app-status-indicator, operation providers
│   ├── loading/                 # PageLoadingShell skeleton
│   ├── produkt-ideen/           # Product idea dialogs
│   ├── projects/                # ProjectCard, ProjectDialog, ProjectsView
│   ├── sortable-table.tsx       # Generic sortable table
│   ├── stats-grid.tsx           # Stats grid layout
│   ├── tag-input.tsx            # Tag input component
│   ├── ui/                      # shadcn/ui primitives
│   ├── vault/                   # Vault viewer, tree, sidebar
│   └── zeiterfassung/           # Time entry + timer components
├── hooks/
│   ├── use-mobile.ts
│   ├── use-revalidate-page.ts   # Triggers router.refresh() + optional sync
│   ├── use-stale-refresh.ts
│   ├── use-timer.ts
│   ├── use-toast.ts
│   └── user.ts
├── lib/
│   ├── auth.ts                  # Server-side auth (getAuthSession)
│   ├── auth-client.ts           # Client-side auth (authClient)
│   ├── cache/                   # Next.js cache tag helpers
│   │   ├── server.ts
│   │   └── vault-tags.ts
│   ├── clients/                 # Client vault-path resolution + mapping
│   │   ├── map-client.ts
│   │   └── vault-paths.ts       # CLIENTS_FOLDER, groupListedFilesByClient, etc.
│   ├── config.ts                # Feature flags + app config
│   ├── dashboard-user-context.tsx
│   ├── frontmatter.ts           # parseFrontmatter, serializeFrontmatter, slugify
│   ├── github/                  # GitHub API helpers
│   │   ├── mirror-context.ts    # getUserVaultRepoConfig
│   │   ├── octokit.ts           # getOctokitClient, fetchNoStore
│   │   └── token.ts             # getGitHubTokenForWorkspace (PAT → owner OAuth)
│   ├── kunden/                  # Legacy client types + mock data
│   ├── mirror/                  # Postgres mirror reads
│   │   ├── bulk-read.ts
│   │   ├── page-loaders.ts      # loadProjectsAndClients, loadClientDetail
│   │   ├── prisma-capabilities.ts
│   │   ├── prisma-rows.ts
│   │   ├── repo-mirror.ts
│   │   └── sync-fields.ts
│   ├── mock-data/               # Dev mock data
│   ├── prisma.ts                # Prisma singleton
│   ├── produkt-ideen/           # Idea types
│   ├── settings-context.tsx
│   ├── sync/                    # GitHub sync pipeline
│   │   ├── branch-tip.ts        # getBranchTipWithTree() — single fetch for commitSha+treeSha
│   │   ├── bump-sync-pointer.ts # bumpUserLastSyncedSha() — advance pointer after app writes
│   │   ├── check-vault-remote.ts
│   │   ├── full-import.ts
│   │   ├── github-webhook.ts
│   │   ├── graphql-blobs.ts     # Parallel blob fetch (GRAPHQL_CONCURRENCY=3)
│   │   ├── incremental.ts       # compareCommits delta; reconcileOrphans opt-in
│   │   ├── markdown-tree-paths.ts
│   │   ├── reconcile-orphans.ts
│   │   ├── sync-log.ts
│   │   ├── sync-vault-for-user.ts
│   │   └── types.ts             # SyncResult, SyncVaultOptions, VaultRemoteCheckResult
│   ├── timer-context.tsx
│   ├── utils.ts                 # cn() and other shared utils
│   ├── vault/                   # Vault service, sync context, file helpers
│   │   ├── config.ts
│   │   ├── display-name.ts
│   │   ├── index.ts
│   │   ├── list-markdown.ts     # listMarkdownUnderPrefix
│   │   ├── listed-file.ts       # getListedFileFrontmatter, getListedFileBody
│   │   ├── mirrorable-text-files.ts
│   │   ├── server.ts
│   │   ├── sync-context.tsx
│   │   └── sync-ui-context.tsx  # VaultSyncProvider, tiered client triggers
│   └── zeiterfassung/           # Time entry helpers
├── prisma/
│   ├── migrations/              # Applied DB migrations
│   └── schema.prisma            # Source of truth for DB schema
├── public/                      # Static assets
├── scripts/
│   └── smee-webhook-forward.ts  # Local dev: smee.io → localhost webhook
├── styles/                      # Global CSS (Tailwind base)
├── types/
│   ├── aufgaben.ts              # Task, TaskFrontmatter, TaskStatus, TaskPriority
│   ├── auth.ts / auth-types.ts
│   ├── clients.ts               # Client, ClientFrontmatter, ClientStatus
│   ├── kunden.ts                # Legacy
│   ├── produkt-ideen.ts
│   ├── projects.ts              # Project, ProjectFrontmatter, ProjectType
│   ├── vault-session-user.ts
│   ├── vault.ts
│   └── zeiterfassung.ts
├── proxy.ts                      # Auth-gating + x-pathname header injection
├── next.config.mjs
├── prisma.config.ts
├── tsconfig.json
├── AGENTS.md                    # AI collaboration guide (vault paths + schemas)
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

Defined in [prisma/schema.prisma](prisma/schema.prisma). Primary models:

| Model | Purpose |
|---|---|
| `User` | Account, vault repo config, sync state (`lastSyncedSha`, `lastSyncAt`, `initialSyncCompleted`, `syncLockedUntil`) |
| `VaultFileMirror` | Per-user mirror of `.md` vault files (path, content, optional `frontmatterJson`, `blobSha`) |
| `Session` / `Account` / `Verification` | better-auth tables |

Module content (ideas, clients, time entries) is stored as **Markdown in the vault repo** and read via the mirror — not as separate Prisma entity tables.

> **Note**: [CONCEPT.md](./CONCEPT.md) describes a fuller indexed schema (`VaultIndex`, `TimeEntry`, …) that is not the current implementation. The live read model is `VaultFileMirror`.

---

## Routes

| Route | Module | Vault path |
|---|---|---|
| `/` | Dashboard home | — |
| `/vault` | Vault file browser | any mirrored text file |
| `/aufgaben` | Task management (Kanban) | `tasks/[slug].md` |
| `/clients` | Client management | `clients/[slug].md` or `clients/[Name]/[slug].md` |
| `/clients/[slug]` | Client detail | same |
| `/produkt-ideen` | Product ideas (Kanban) | `ideas/products/[slug].md` |
| `/projects` | Portfolio projects | `projects/[slug].md` |
| `/zeiterfassung` | Time tracking (list + manual entry) | `zeiterfassung/YYYY-MM/YYYY-MM-DD_projekt.md` |
| `/zeiterfassung2` | Time tracking v2 (donut timer + sessions) | same |
| `/profil` | Profile + vault repo settings | `profile/[section]/[slug].md` |
| `/kunden` | Legacy client list | `clients/` (same mirror) |

---

## Feature Flags

All flags live in [lib/config.ts](lib/config.ts):

| Flag | Default | Meaning |
|---|---|---|
| `auth` | `true` | Auth is active; middleware enforces login |
| `githubSync` | `true` | When user has `githubSync` in DB + repo configured, reads use mirror / GitHub |
| `editing` | `true` | Vault file editing (GitHub API + mirror upsert) |
| `timeTracking` | `true` | Time tracking module enabled |
| `productIdeas` | `true` | Product ideas module enabled |

---

## Vault mirror & GitHub sync

### Architecture

```text
GitHub vault repo (source of truth)
        │
        ├─ Push webhook ──► POST /api/webhook/github ──► syncVaultForUser()
        │
        ├─ App writes ─────► Octokit create/update/delete ──► mirror upsert/delete
        │
        └─ Background sync ► compareCommits + tree reconcile ──► VaultFileMirror

Dashboard UI ◄── listMarkdownUnderPrefix / getGitHubTree (mirror paths)
```

### Key files

| Path | Role |
|------|------|
| `lib/sync/sync-vault-for-user.ts` | Full pull: import, incremental sync, optional orphan reconcile |
| `lib/sync/branch-tip.ts` | `getBranchTipWithTree()` — single fetch for `commitSha` + `treeSha` |
| `lib/sync/bump-sync-pointer.ts` | `bumpUserLastSyncedSha()` — advances `lastSyncedSha` after app writes so follow-up pull is a no-op |
| `lib/sync/check-vault-remote.ts` | Branch-tip check only (no lock, no mirror mutation) |
| `lib/sync/incremental.ts` | `compareCommits` delta; `reconcileOrphans` is opt-in (default false) |
| `lib/sync/graphql-blobs.ts` | Parallel GraphQL blob fetch (`GRAPHQL_CONCURRENCY=3`) |
| `lib/sync/types.ts` | `SyncResult`, `SyncVaultOptions`, `VaultRemoteCheckResult` |
| `lib/sync/github-webhook.ts` | Signature verify, resolve users by owner/repo/branch |
| `app/api/webhook/github/route.ts` | Webhook HTTP handler (202 + `after()` sync) |
| `lib/vault/sync-ui-context.tsx` | Tiered client triggers: focus check, writes, webhook poll |
| `components/layout/app-status-indicator.tsx` | Unified top-right status (save + mirror sync) |
| `components/layout/dashboard-operation-providers.tsx` | `SyncProvider` + navigation background-save |
| `lib/background-save.ts` / `hooks/use-background-save.ts` | Background save helpers |
| `app/(dashboard)/template.tsx` | `VaultSyncProvider` + `AppStatusIndicator` |
| `app/actions/vault-sync.ts` | `checkVaultRemote`, `executeVaultSync`, `getVaultSyncSnapshot`, force resync |
| `scripts/smee-webhook-forward.ts` | Local dev: smee.io → localhost webhook |

### Sync triggers (client)

| Trigger | Action |
|---------|--------|
| **Navigation** | `router.refresh()` only (mirror read from Postgres; no GitHub) |
| **Tab focus** (after hidden) | `checkVaultRemote()` → `executeVaultSync()` only if branch tip ≠ `lastSyncedSha` |
| **After GitHub write** | Mirror + `lastSyncedSha` updated on write; `requestSyncAfterWrite()` usually fast `up-to-date` |
| **Webhook poll** (tab visible) | `getVaultSyncSnapshot()` every **12s** (30s if `NEXT_PUBLIC_VAULT_WEBHOOK_ENABLED=false`) — UI refresh only, no client pull |

Pull cooldown: **60s** between client-initiated full syncs (writes bypass cooldown).

### Sync triggers (server)

- **GitHub push webhook** — `syncVaultMirrorForGitHubPush()` for all users matching repo + branch
- **Manual** — Profil **Cache leeren & neu laden** (`forceFullVaultResync`)

### UI status indicator (single pill, top-right)

All save, sync, and mirror activity is shown in **`AppStatusIndicator`** (`fixed top-3 right-3`). Do not add separate floating indicators or success toasts for routine saves.

| Source | When it shows |
|--------|----------------|
| `SyncProvider` (`startSync` / `endSync`) | GitHub writes in flight → „Speichern…“, then „Gespeichert“ |
| `VaultEditorGuardProvider` | Background save on navigation (Vault editor) |
| `VaultSyncProvider` | Mirror check / pull / error |

Priority: **error** → **saving** → **syncing** → **checking** → **success** (auto-hides).

Providers:

- `DashboardOperationProviders` in `dashboard-shell.tsx` — wraps sidebar + pages (navigation save intercept).
- `VaultSyncProvider` in `app/(dashboard)/template.tsx` — mirror sync tick + indicator mount.

### Background save (default pattern)

Navigate or close UI **immediately**; persist in the background. Server actions keep running after unmount; only avoid `setState` in the save callback.

1. **Capture state synchronously** before `router.push` / `onOpenChange(false)`.
2. **Start tracking**: `startSync()` or `useBackgroundSave()`.
3. **Fire save**: `void saveTask(...)` / `editor.saveContent(captured, { background: true })`.
4. **Feedback**: global indicator only (no `toast.success` for routine saves).

```tsx
import { useBackgroundSave } from "@/hooks/use-background-save";

const runBackgroundSave = useBackgroundSave();

const onClose = () => {
  const payload = buildPayload(); // sync snapshot
  onOpenChange(false);
  if (!payload) return;
  runBackgroundSave(() => saveTask(payload));
};
```

Vault editor navigation uses `VaultEditorGuardProvider` (link intercept + `captureContent` / `saveContent`). See `lib/vault/editor-guard-context.tsx`.

Low-level (non-React): `runBackgroundSave()` in `lib/background-save.ts` — pair with `startSync`/`endSync` manually.

### Detail drawer (create + edit)

Vault modules use a **right drawer** instead of modals. Shared pieces:

| Path | Role |
|------|------|
| `components/detail-drawer/detail-drawer.tsx` | Drawer chrome (header, scroll body, footer) |
| `components/detail-drawer/detail-drawer-footer.tsx` | Schließen / Speichern / optional Löschen |
| `hooks/use-detail-drawer.ts` | Dirty tracking, close → background save, explicit save |
| `lib/detail-drawer/constants.ts` | `DRAFT_RECORD_SLUG` (`__draft__`) for unsaved records |

Module views: `task-detail-view`, `project-detail-view`, `idea-detail-view`, `entry-detail-view`, `client-quick-detail-drawer` (Listen-Drawer; Vollseite bleibt `client-detail-view` unter `/clients/[slug]`).

**Create flow:** `setTarget(createDraft*())` + `setOpen(true)`. On save, slug is derived (`slugify(title)` etc.). Parent `handleSave` should treat `isDraftSlug` when syncing drawer target.

**Close flow:** `useDetailDrawer` → `closeAndSaveInBackground` → `useBackgroundSave` + parent optimistic `handleSave`.

### Vault sync indicator phases (mirror)

| Phase | Color | Meaning |
|-------|-------|---------|
| `checking` | Yellow | Remote branch-tip check (focus) |
| `syncing` | Purple | Full pull in flight / webhook lock held |
| `success` | Green | Up to date or synced; auto-hides ~2s |
| `error` | Red | `lastSyncError` or failed action; auto-hides ~5s |

### Logging

Server logs use prefix `[vault-sync]` (check, start, incremental delta, complete, webhook).

### Local webhook development

See [README.md](./README.md#local-webhook-smeeio). Use `npm run dev:smee` with package **`smee-client`** (not `npx smee.io`).

---

## Current State

### Working

- **Authentication** — better-auth with GitHub OAuth; middleware gates dashboard routes; single-admin enforcement.
- **Vault mirror** — `VaultFileMirror` + sync state on `User`; full and incremental import from GitHub.
- **Vault UI** — tree browser, editor, optimistic mutations with GitHub + mirror updates.
- **GitHub webhook** — `/api/webhook/github` for push-triggered mirror sync.
- **Sync optimizations** — single `getBranchTipWithTree()` call per sync cycle; `reconcileOrphans` is opt-in (hot path skips it); parallel GraphQL blob batching; post-write `bumpUserLastSyncedSha()` avoids redundant re-processing.
- **Sync UI** — unified top-right `AppStatusIndicator` (save + mirror sync) + auto-refresh after background sync.
- **Background save** — Vault navigation + Aufgaben drawer; `useBackgroundSave()` / `SyncProvider`.
- **Aufgaben** — task management Kanban (`tasks/` vault folder); CRUD via GitHub API.
- **Clients** — client management with detail pages (`clients/` vault folder); replaces legacy `/kunden`.
- **Projects** — portfolio project management (`projects/` vault folder).
- **Produkt-Ideen** — product idea Kanban (`ideas/products/` vault folder).
- **Zeiterfassung** — time tracking list; `zeiterfassung2` adds donut timer + sessions UI.
- **Profil** — vault repo settings, mirror stats, manual full resync.
- **Middleware** — injects `x-pathname` header so server components can read the active route.

### Partial / planned

- **MCP server** — described in CONCEPT.md; not implemented in this app repo.
- **ISR / public JSON APIs** — webhook currently syncs mirror only; separate site revalidation is not wired.
- **`zeiterfassung2`** — new timer UI exists at `/zeiterfassung2` but is not yet linked in the main sidebar.
