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
│   │   ├── (shell)/             # Non-workspace pages (own sidebar/layout)
│   │   │   ├── admin/           # Platform admin (users, roles, invitations)
│   │   │   ├── profil/          # User profile
│   │   │   ├── workspaces/      # Workspace switcher / list
│   │   │   └── layout.tsx
│   │   ├── w/                   # Workspace-scoped routes
│   │   │   └── [workspaceSlug]/
│   │   │       ├── aufgaben/    # Task Kanban
│   │   │       ├── clients/     # Client management + detail pages
│   │   │       ├── produkt-ideen/
│   │   │       ├── projects/
│   │   │       ├── vault/       # Vault file browser + editor
│   │   │       ├── settings/    # Workspace settings
│   │   │       │   ├── general/
│   │   │       │   ├── github/
│   │   │       │   ├── mcp/     # MCP API key management
│   │   │       │   ├── members/
│   │   │       │   ├── pages/
│   │   │       │   └── users/
│   │   │       ├── [pageSlug]/  # Dynamic workspace pages
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx     # Workspace home
│   │   ├── template.tsx         # VaultSyncProvider + AppStatusIndicator
│   │   ├── aufgaben/            # Legacy top-level task route (kept)
│   │   ├── clients/             # Legacy top-level client route (kept)
│   │   ├── produkt-ideen/       # Legacy top-level ideas route (kept)
│   │   ├── projects/            # Legacy top-level projects route (kept)
│   │   ├── settings/
│   │   ├── vault/               # Legacy top-level vault route (kept)
│   │   ├── zeiterfassung/
│   │   ├── zeiterfassung2/
│   │   ├── layout.tsx           # Dashboard shell (sidebar + header)
│   │   └── page.tsx             # Dashboard home
│   ├── actions/                 # Server actions per module
│   │   ├── admin-roles.ts
│   │   ├── admin-users.ts
│   │   ├── aufgaben.ts          # listTasks, saveTask, deleteTask, updateTaskStatus
│   │   ├── clients.ts           # listClients, saveClient, deleteClient
│   │   ├── github.ts            # createOrUpdateGitHubFile, deleteGitHubFile
│   │   ├── invitations.ts
│   │   ├── produkt-ideen.ts
│   │   ├── projects.ts
│   │   ├── settings.ts
│   │   ├── setup.ts
│   │   ├── vault-sync.ts        # checkVaultRemote, executeVaultSync, getVaultSyncSnapshot
│   │   ├── vault.ts
│   │   ├── workspace-settings.ts
│   │   ├── workspace-vault-sync.ts
│   │   ├── workspaces.ts
│   │   └── zeiterfassung.ts
│   ├── api/
│   │   ├── auth/                # better-auth route handler
│   │   ├── mcp/[transport]/     # MCP server (streamable HTTP + SSE)
│   │   └── webhook/github/      # GitHub push → vault mirror sync
│   └── generated/
│       └── prisma/              # Auto-generated Prisma client (do not edit)
├── components/
│   ├── aufgaben/
│   ├── clients/
│   ├── dashboard/
│   ├── editor/                  # Novel editor + Tiptap extensions
│   ├── kanban-board.tsx
│   ├── layout/                  # App shell, app-status-indicator, operation providers
│   ├── loading/
│   ├── produkt-ideen/
│   ├── projects/
│   ├── ui/                      # shadcn/ui primitives (component files only; CSS vendored)
│   ├── vault/
│   └── zeiterfassung/
├── hooks/
│   ├── use-mobile.ts
│   ├── use-revalidate-page.ts
│   ├── use-stale-refresh.ts
│   ├── use-timer.ts
│   ├── use-toast.ts
│   └── user.ts
├── lib/
│   ├── auth.ts                  # Server-side auth (getAuthSession)
│   ├── auth-client.ts           # Client-side auth (authClient)
│   ├── background-save.ts
│   ├── cache/                   # Next.js cache tag helpers
│   │   ├── server.ts
│   │   └── vault-tags.ts
│   ├── clients/
│   ├── config.ts                # Feature flags + app config
│   ├── dashboard-user-context.tsx
│   ├── entity/                  # Shared entity helpers
│   ├── frontmatter.ts
│   ├── github/
│   │   ├── mirror-context.ts
│   │   ├── octokit.ts
│   │   └── token.ts             # getGitHubTokenForWorkspace (PAT → owner OAuth)
│   ├── invitation-utils.ts
│   ├── invitations/             # Invitation resolution logic
│   │   ├── accept-app-invitation-by-token.ts
│   │   ├── fulfill-workspace-invitation.ts
│   │   └── resolve-invitations-for-new-user.ts
│   ├── invite-oauth.ts
│   ├── mcp/                     # MCP auth helpers
│   │   ├── api-key.ts
│   │   ├── auth.ts
│   │   ├── oauth-resource-cors.ts
│   │   └── urls.ts
│   ├── mirror/                  # Postgres mirror reads
│   ├── page-metadata.ts
│   ├── platform-admin.ts
│   ├── platform-permissions.ts  # PlatformPermission type + hasPlatformPermission
│   ├── platform-roles.ts        # ensurePlatformRoles, getUserPermissionContext, userHasPermission
│   ├── prisma.ts
│   ├── rate-limit.ts
│   ├── security-audit.ts
│   ├── settings-context.tsx
│   ├── sync/                    # GitHub sync pipeline
│   │   ├── branch-tip.ts
│   │   ├── bump-sync-pointer.ts
│   │   ├── check-vault-remote.ts
│   │   ├── full-import.ts
│   │   ├── github-webhook.ts
│   │   ├── graphql-blobs.ts
│   │   ├── incremental.ts
│   │   ├── markdown-tree-paths.ts
│   │   ├── reconcile-orphans.ts
│   │   ├── sync-log.ts
│   │   ├── sync-vault-for-user.ts
│   │   └── types.ts
│   ├── timer-context.tsx
│   ├── utils.ts
│   ├── vault/
│   ├── vault-link-context.tsx
│   ├── workspace-context.tsx    # WorkspaceData, WorkspacePageData, WorkspaceNavSectionData
│   ├── workspace-defaults.ts
│   ├── workspace-page-templates.ts
│   ├── workspace-paths.ts
│   ├── workspace-seed.ts
│   ├── workspace-slug.ts
│   └── zeiterfassung/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/
├── scripts/
│   └── smee-webhook-forward.ts
├── styles/
│   ├── globals.css              # Tailwind base; imports shadcn-tailwind.css
│   └── shadcn-tailwind.css      # Vendored shadcn animations + custom variants
├── types/
├── proxy.ts                     # Auth-gating + x-pathname header injection (Next.js middleware)
├── next.config.mjs
├── prisma.config.ts
├── tsconfig.json
├── AGENTS.md
├── CONCEPT.md
├── DECISIONS.md
└── DOCUMENTATION.md
```

---

## Tech Stack

| Technology | Version | Official Docs |
|---|---|---|
| Next.js (App Router) | ^16.2.5 | https://nextjs.org/docs |
| React | ^19.2.4 | https://react.dev |
| TypeScript | ^5.9.3 | https://www.typescriptlang.org/docs |
| Tailwind CSS v4 | ^4.1.18 | https://tailwindcss.com/docs |
| shadcn/ui (component files only) | — | https://ui.shadcn.com |
| Novel (rich text editor) | ^1.0.2 | https://novel.sh/docs |
| Prisma ORM | ^7.8.0 | https://www.prisma.io/docs |
| PostgreSQL (Prisma Postgres) | — | https://www.prisma.io/postgres |
| better-auth | ^1.6.9 | https://www.better-auth.com/docs |
| Recharts | 2.15.4 | https://recharts.org/en-US/api |
| date-fns | 4.1.0 | https://date-fns.org/docs |
| mcp-handler | — | MCP server (streamable HTTP) |
| Vercel (hosting) | — | https://vercel.com/docs |

> **shadcn removed from package.json** — shadcn CSS animations and custom variants are vendored into `styles/shadcn-tailwind.css`. Component source files remain under `components/ui/`.

---

## Database Schema Overview

Defined in [prisma/schema.prisma](prisma/schema.prisma).

The schema is **workspace-centric**: vault config, sync state, and file mirrors are scoped to `Workspace`, not `User`.

### Platform models

| Model | Purpose |
|---|---|
| `PlatformSettings` | Singleton: platform-wide flags (`usersCanCreateWorkspaces`) |
| `AppRole` | Platform roles (`user`, `admin`) with a `permissions` string array |
| `User` | Account; linked to one `AppRole`; no vault config (moved to Workspace) |
| `Session` / `Account` / `Verification` | better-auth tables |

### Workspace models

| Model | Purpose |
|---|---|
| `Workspace` | Vault repo config, GitHub sync state (`lastSyncedSha`, `initialSyncCompleted`, …), MCP config (`mcpEnabled`, `mcpApiKeyHash`), `type` (PERSONAL \| TEAM) |
| `WorkspaceMember` | User ↔ Workspace membership with role |
| `WorkspaceNavSection` | Named nav sections inside a workspace sidebar |
| `WorkspacePage` | Configurable pages per workspace (templateKey, slug, label, icon, order, isEnabled) |
| `WorkspaceFileMirror` | Per-workspace mirror of text vault files (replaces `VaultFileMirror`) |
| `UserWorkspacePreference` | Per-user last-active workspace preference |

### Team models

| Model | Purpose |
|---|---|
| `Team` | Named team; linked to a workspace via `teamId` |
| `TeamMember` | User ↔ Team membership |

### Invitation models

| Model | Purpose |
|---|---|
| `AppInvitation` | Platform-level invite (grants access to the app) |
| `WorkspaceInvitation` | Workspace-level invite (grants membership in a workspace) |

Module content (ideas, clients, time entries) is stored as **Markdown in the vault repo** and read via `WorkspaceFileMirror`.

---

## Routes

### Shell routes (`(shell)` group — non-workspace pages)

| Route | Purpose |
|---|---|
| `/profil` | User profile + global preferences |
| `/workspaces` | Workspace list / switcher |
| `/admin` | Platform admin overview |
| `/admin/users` | Manage platform users |
| `/admin/roles` | Manage platform roles |
| `/admin/invitations` | Manage app invitations |

### Workspace routes (`/w/[workspaceSlug]/...`)

| Route | Module | Vault path |
|---|---|---|
| `/w/[slug]` | Workspace home | — |
| `/w/[slug]/vault` | Vault file browser | any mirrored text file |
| `/w/[slug]/vault/[...path]` | Vault file editor | specific file |
| `/w/[slug]/aufgaben/[taskSlug]` | Task detail | `tasks/[slug].md` |
| `/w/[slug]/clients` | Client management | `clients/[slug].md` |
| `/w/[slug]/clients/[slug]` | Client detail | same |
| `/w/[slug]/produkt-ideen/[cat]/[slug]` | Product idea detail | `ideas/products/[slug].md` |
| `/w/[slug]/projects/[slug]` | Project detail | `projects/[slug].md` |
| `/w/[slug]/[pageSlug]` | Dynamic workspace page | — |
| `/w/[slug]/settings` | Workspace settings root | — |
| `/w/[slug]/settings/general` | General settings | — |
| `/w/[slug]/settings/github` | GitHub vault config | — |
| `/w/[slug]/settings/mcp` | MCP API key | — |
| `/w/[slug]/settings/members` | Workspace members | — |
| `/w/[slug]/settings/pages` | Sidebar page config | — |
| `/w/[slug]/settings/users` | User management (workspace-level) | — |

### Legacy top-level routes (kept for backwards compat)

`/aufgaben`, `/clients`, `/clients/[slug]`, `/produkt-ideen`, `/projects`, `/vault`, `/zeiterfassung`, `/zeiterfassung2`, `/kunden`

### Public routes

| Route | Purpose |
|---|---|
| `/login` | GitHub OAuth sign-in |
| `/register` | Registration (invite-gated) |
| `/workspace-invite/[token]` | Accept workspace invitation |

---

## Feature Flags

All flags live in [lib/config.ts](lib/config.ts):

| Flag | Default | Meaning |
|---|---|---|
| `githubSync` | `true` | When workspace has `githubSync` in DB + repo configured, reads use mirror / GitHub |
| `editing` | `true` | Vault file editing (GitHub API + mirror upsert) |
| `timeTracking` | `true` | Time tracking module enabled |
| `productIdeas` | `true` | Product ideas module enabled |

---

## Platform roles & permissions

Roles are stored in `AppRole` and assigned to users. Two system roles exist:

| Role key | Permissions |
|---|---|
| `user` | `workspace.invite` |
| `admin` | `platform.admin`, `workspace.create`, `invitation.create`, `workspace.invite`, `user.manage`, `role.manage` |

Key files:

| Path | Role |
|---|---|
| `lib/platform-permissions.ts` | `PlatformPermission` type + `hasPlatformPermission()` |
| `lib/platform-roles.ts` | `ensurePlatformRoles()`, `getUserPermissionContext()`, `userHasPermission()`, `syncBetterAuthRoleForUser()` |
| `lib/platform-admin.ts` | Admin-level user/role operations |

`ensurePlatformRoles()` is idempotent — safe to call on every boot.

---

## MCP server

The MCP server is implemented at `app/api/mcp/[transport]/route.ts` using **mcp-handler** (streamable HTTP transport).

Authentication uses a workspace API key. Each workspace can generate an API key under **Settings → MCP**. The key is stored hashed (`mcpApiKeyHash`) on the `Workspace` row.

| Path | Role |
|---|---|
| `app/api/mcp/[transport]/route.ts` | MCP route handler; registers tools and wires auth |
| `lib/mcp/auth.ts` | `resolveWorkspaceForMcpTool()`, `verifyMcpBearerToken()` |
| `lib/mcp/api-key.ts` | Key generation + hashing |
| `lib/mcp/oauth-resource-cors.ts` | CORS allowlist for MCP OAuth protected-resource endpoint |
| `lib/mcp/urls.ts` | MCP endpoint URL helpers |
| `lib/rate-limit.ts` | Rate limiting for MCP requests |

`proxy.ts` passes `/.well-known/` paths through without redirect so MCP OAuth metadata probes succeed.

Currently registered tools: `get_workspace_info` (returns workspace id / name / slug for the authenticated API key).

---

## Invitations

Two invitation flows exist:

| Type | Model | Flow |
|---|---|---|
| **App invitation** | `AppInvitation` | Admin creates invite → user registers via token → gets `user` role + personal workspace |
| **Workspace invitation** | `WorkspaceInvitation` | Workspace member invites email → recipient accepts at `/workspace-invite/[token]` |

Key files:

| Path | Role |
|---|---|
| `lib/invitations/resolve-invitations-for-new-user.ts` | `resolveWorkspaceInvitationsForNewUser()` + `resolveAppInvitationsForNewUser()` — called during sign-up |
| `lib/invitations/fulfill-workspace-invitation.ts` | Marks invitation accepted + creates WorkspaceMember |
| `lib/invitations/accept-app-invitation-by-token.ts` | Validates app invitation token |
| `lib/invitation-utils.ts` | Shared invitation helpers |
| `app/actions/invitations.ts` | Server actions for invitation CRUD |

---

## Vault mirror & GitHub sync

### Architecture

```text
GitHub vault repo (source of truth)
        │
        ├─ Push webhook ──► POST /api/webhook/github ──► syncVaultForWorkspace()
        │
        ├─ App writes ─────► Octokit create/update/delete ──► mirror upsert/delete
        │
        └─ Background sync ► compareCommits + tree reconcile ──► WorkspaceFileMirror

Dashboard UI ◄── listMarkdownUnderPrefix / getGitHubTree (mirror paths)
```

Sync state (`lastSyncedSha`, `lastSyncAt`, `initialSyncCompleted`, `syncLockedUntil`) is on the `Workspace` row, not the `User` row.

### Key files

| Path | Role |
|------|------|
| `lib/sync/sync-vault-for-user.ts` | Full pull: import, incremental sync, optional orphan reconcile |
| `lib/sync/branch-tip.ts` | `getBranchTipWithTree()` — single fetch for `commitSha` + `treeSha` |
| `lib/sync/bump-sync-pointer.ts` | `bumpUserLastSyncedSha()` — advances `lastSyncedSha` after app writes |
| `lib/sync/check-vault-remote.ts` | Branch-tip check only (no lock, no mirror mutation) |
| `lib/sync/incremental.ts` | `compareCommits` delta; `reconcileOrphans` is opt-in (default false) |
| `lib/sync/graphql-blobs.ts` | Parallel GraphQL blob fetch (`GRAPHQL_CONCURRENCY=3`) |
| `lib/sync/types.ts` | `SyncResult`, `SyncVaultOptions`, `VaultRemoteCheckResult` |
| `lib/sync/github-webhook.ts` | Signature verify, resolve workspaces by owner/repo/branch |
| `app/api/webhook/github/route.ts` | Webhook HTTP handler (202 + `after()` sync) |
| `lib/vault/sync-ui-context.tsx` | Tiered client triggers: focus check, writes, webhook poll |
| `components/layout/app-status-indicator.tsx` | Unified top-right status (save + mirror sync) |
| `components/layout/dashboard-operation-providers.tsx` | `SyncProvider` + navigation background-save |
| `lib/background-save.ts` / `hooks/use-background-save.ts` | Background save helpers |
| `app/(dashboard)/template.tsx` | `VaultSyncProvider` + `AppStatusIndicator` |
| `app/actions/vault-sync.ts` | `checkVaultRemote`, `executeVaultSync`, `getVaultSyncSnapshot`, force resync |
| `app/actions/workspace-vault-sync.ts` | Workspace-scoped sync actions |
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

- **GitHub push webhook** — `syncVaultMirrorForGitHubPush()` for all workspaces matching repo + branch
- **Manual** — Workspace Settings **Cache leeren & neu laden** (`forceFullVaultResync`)

### UI status indicator (single pill, top-right)

All save, sync, and mirror activity is shown in **`AppStatusIndicator`** (`fixed top-3 right-3`). Do not add separate floating indicators or success toasts for routine saves.

| Source | When it shows |
|--------|----------------|
| `SyncProvider` (`startSync` / `endSync`) | GitHub writes in flight → „Speichern…", then „Gespeichert" |
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

## Proxy (middleware)

`proxy.ts` is the Next.js middleware file (exported as `proxy`, matched via `config.matcher`). It:

- Redirects unauthenticated requests to `/login` (with `callbackUrl`)
- Redirects authenticated users away from public pages (except invite flows)
- Passes `/.well-known/` paths through without redirect (required for MCP OAuth probes)
- Injects `x-pathname` header so server components can read the active route

> `middleware.ts` was deleted — `proxy.ts` is the single middleware entry point.

---

## Current State

### Working

- **Authentication** — better-auth with GitHub OAuth; `proxy.ts` gates dashboard routes; invite-gated registration.
- **Platform roles** — `AppRole` with `user` / `admin` system roles; permission checks via `hasPlatformPermission()`.
- **Multi-workspace** — `Workspace` model with per-workspace vault config, sync state, and sidebar pages.
- **Workspace members** — `WorkspaceMember`; workspace settings pages for member management.
- **Invitations** — `AppInvitation` (platform) + `WorkspaceInvitation` (workspace); resolution at sign-up.
- **Admin** — `/admin` routes for platform users, roles, and invitations.
- **MCP server** — `/api/mcp/[transport]`; workspace API key auth; `get_workspace_info` tool.
- **Vault mirror** — `WorkspaceFileMirror` (replaces `VaultFileMirror`) + sync state on `Workspace`.
- **Vault UI** — tree browser, editor, optimistic mutations with GitHub + mirror updates.
- **GitHub webhook** — `/api/webhook/github` for push-triggered mirror sync.
- **Sync optimizations** — single `getBranchTipWithTree()` call per cycle; `reconcileOrphans` opt-in; parallel GraphQL blob batching; post-write `bumpSyncedSha` avoids redundant re-processing.
- **Sync UI** — unified top-right `AppStatusIndicator` (save + mirror sync) + auto-refresh after background sync.
- **Background save** — Vault navigation + Aufgaben drawer; `useBackgroundSave()` / `SyncProvider`.
- **Aufgaben** — task Kanban (`tasks/` vault folder); CRUD via GitHub API.
- **Clients** — client management with detail pages (`clients/` vault folder).
- **Projects** — portfolio project management (`projects/` vault folder).
- **Produkt-Ideen** — product idea Kanban (`ideas/products/` vault folder).
- **Zeiterfassung** — time tracking list; `zeiterfassung2` adds donut timer + sessions UI.
- **shadcn CSS vendored** — `styles/shadcn-tailwind.css`; `shadcn` removed from `package.json`.

### Partial / planned

- **ISR / public JSON APIs** — webhook currently syncs mirror only; separate site revalidation is not wired.
- **`zeiterfassung2`** — timer UI exists at `/zeiterfassung2` but not yet linked in the main sidebar.
- **Teams** — `Team` / `TeamMember` models exist; team workspace UI not yet built.
- **MCP tools** — only `get_workspace_info` registered; vault read/write tools planned.
