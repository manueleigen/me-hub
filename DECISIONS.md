# DECISIONS.md — Architectural Decision Log

Record every significant architectural choice here, in reverse-chronological order.
Format: date · decision · context · alternatives considered · rationale.

---

## 2026-05-09 — Prisma Postgres as the single ORM + hosted database

**Decision**: Use Prisma ORM with the official Prisma Postgres hosted database (via `@prisma/adapter-pg`) as the single persistence layer for auth, vault index, time entries, ideas, and all app state.

**Context**: The project needs a DB for better-auth session tables, a queryable vault index (replacing Obsidian's Dataview for the web layer), and module-specific data (time entries, ideas, clients). The stack needs to be manageable by a solo developer on a free tier.

**Alternatives considered**:

- Supabase — more features but a separate ecosystem from Prisma. Adds complexity.
- PlanetScale / Turso — MySQL-based or SQLite-based; JSON querying on frontmatter would be harder.
- Raw SQL with `pg` — more control but no type safety; Prisma's generated client is worth it here.

**Rationale**: Prisma Postgres bundles the ORM and the hosted DB in one ecosystem (`npx create-db`). The Prisma client is auto-generated into `app/generated/prisma/` which keeps it typed and consistent. JSON column support on PostgreSQL enables querying vault frontmatter directly without a separate schema per module.

---

## 2026-05-09 — Mock-first module architecture with feature flags

**Decision**: All modules (vault, time tracking, ideas, clients) ship with mock data in `lib/*/mock-data.ts` and are gated behind feature flags in `lib/config.ts`. Real data sources (GitHub API, database) are wired in behind `features.githubSync` once stable.

**Context**: Building the full GitHub sync pipeline before the UI would block visible progress. The DB schema is defined but the UI-to-DB wiring and GitHub API client are not done yet.

**Alternatives considered**:

- Build DB integration first — slows down UI iteration; harder to catch UX problems early.
- Skeleton screens / empty states — less useful for developing the full feature surface.

**Rationale**: Mock data lets the entire UI be built and tested without a live database or GitHub tokens. Switching from mock to real is a one-line change per module (`features.githubSync = true`). Risk: mock data can diverge from real data shapes — keep types in `lib/*/types.ts` as the shared contract.

---

## 2026-05-09 — better-auth over NextAuth / Auth.js

**Decision**: Use `better-auth` (^1.6.9) with the Prisma adapter for authentication, instead of Auth.js (NextAuth v5).

**Context**: Auth.js v5 was still in beta at project start and its App Router integration was unstable. better-auth offers a more explicit API and has first-class Prisma adapter support.

**Alternatives considered**:

- Auth.js v5 (NextAuth) — the de-facto standard but unstable beta at the time.
- Lucia — lightweight but requires more manual session plumbing.
- Clerk — managed auth, but adds a third-party dependency for a single-user app.

**Rationale**: better-auth's `nextCookies()` plugin integrates cleanly with the App Router. The Prisma adapter auto-manages `User`, `Session`, `Account`, and `Verification` tables. For a single-user private app, the email/password + optional GitHub OAuth setup is sufficient.

---

## 2026-05-09 — Two-repo split: App Repo + Vault Repo

**Decision**: Maintain two separate GitHub repositories — one for the Next.js application code, one for the MeHub Obsidian Vault (Markdown content).

**Context**: Obsidian Git needs a clean repo that only contains Markdown files. Mixing app code and vault content in one repo would break Obsidian's sync workflow and complicate CI/CD.

**Alternatives considered**:

- Monorepo with subdirectory — Obsidian Git doesn't support subdirectory-scoped sync cleanly.
- Single repo — simpler, but deployment on Vercel would trigger on every content push.

**Rationale**: Separate repos mean Vercel only deploys on app code changes. Content changes go through the vault repo webhook → ISR revalidation path, never triggering a full deploy. The vault repo is also the canonical offline store accessible directly from Obsidian.

---

## 2026-05-09 — Removed Prisma adapter and email/password from better-auth

**Decision**: Stripped `prismaAdapter` and `emailAndPassword` from `lib/auth.ts`. Auth now uses only GitHub OAuth and better-auth's default in-memory session store.

**Context**: The Prisma adapter was causing `unable_to_create_user` errors during GitHub OAuth (stale generated client, `emailVerified` field mismatch). Removing it unblocks login while the DB integration is stabilised.

**Alternatives considered**:

- Re-generate Prisma client (`npx prisma generate`) — the correct long-term fix; deferred for now.
- Keep email/password — not needed for a single-user personal app with GitHub OAuth.

**Rationale**: Fastest path to a working login. Trade-off: sessions are lost on server restart, and the `User` table is no longer written to by better-auth. Re-add the adapter once the generated client is confirmed in sync with the schema.

---

## 2026-05-12 — GitHub REST API as the sole vault persistence layer (no DB)

**Decision**: Vault read/write operations go directly to the GitHub REST API via Octokit (`repos.getContent`, `repos.createOrUpdateFileContents`, `repos.deleteFile`, `git.getTree`). No intermediate DB layer or cache.

**Context**: The vault content lives in a separate GitHub repo (see two-repo decision). The Prisma DB integration was deferred (see adapter removal decision). A direct GitHub API approach unblocks all CRUD operations without needing the DB layer ready.

**Alternatives considered**:

- Prisma + DB as index — enables fast search and frontmatter queries, but requires the DB integration to be stable first.
- ISR + on-demand revalidation — read-fast path, but writes still need the GitHub API, so the complexity doubles.

**Rationale**: Direct API keeps the implementation surface small. The GitHub API is the canonical source of truth (it's what Obsidian writes to). SHA-based updates (fetch current SHA, then write) satisfy the required optimistic concurrency check. Trade-off: every write round-trips to GitHub; acceptable for a low-traffic personal app.

---

## 2026-05-12 — `.gitkeep` convention for empty GitHub folders

**Decision**: `vaultService.createFolder` creates a `<folderPath>/.gitkeep` file. `getTree()` filters `.gitkeep` entries so they never appear in the UI.

**Context**: GitHub has no concept of an empty directory. Creating a folder requires at least one file inside it.

**Alternatives considered**:

- `README.md` placeholder — visible and meaningful, but would show up as an item in the folder view.
- `_keep` file — arbitrary convention with the same filtering trade-off.

**Rationale**: `.gitkeep` is a widely understood convention, invisible after filtering. The filter is a single `node.name !== ".gitkeep"` guard in `getTree()`.

---

## 2026-05-12 — Folder deletion via recursive git tree blob enumeration

**Decision**: `deleteFolder` fetches the full recursive git tree (`git.getTree` with `recursive: "1"`), filters blobs by path prefix, then deletes each file individually. No folder-delete API call is made.

**Context**: GitHub's REST API has no bulk-delete or folder-delete endpoint. Each file requires its own SHA to delete.

**Alternatives considered**:

- `getContent` per file to retrieve SHA — N+1 API calls before deletions even start.
- Git Data API (low-level trees/commits) — allows a single commit, but requires constructing a new tree object manually; significantly more complex.

**Rationale**: The `git.getTree` response includes blob SHAs directly, so one call gives all SHAs needed. Individual deletes are sequential but acceptable; a personal vault rarely has hundreds of files in one folder. The Git Data API approach is the correct performance choice if volume grows.

---

## 2026-05-12 — SyncContext pattern for background GitHub operation tracking

**Decision**: A `SyncContext` React context (`lib/vault/sync-context.tsx`) tracks in-flight GitHub operations with a `pending` counter. All vault mutations call `startSync()` / `endSync()`. A `SyncIndicator` component shows a floating pill ("Speichern…" / "Gespeichert"). A `beforeunload` handler fires while `pending > 0`.

**Context**: GitHub writes are async and can take 500–2000 ms. The UI must feel fast (optimistic) while also preventing accidental tab close during writes.

**Alternatives considered**:

- Per-component loading state — works for individual buttons but can't show a global indicator or block tab close.
- Toast-only feedback — sonner toasts are too ephemeral for ongoing saves; disappear before the user notices.

**Rationale**: A context-level counter decouples the indicator from individual components. `beforeunload` is the only browser-native way to block tab close; it requires the handler to be active exactly while writes are in-flight, which the counter enables precisely.

---

## 2026-05-12 — VaultShell client wrapper to provide SyncContext at layout level

**Decision**: `components/vault/vault-shell.tsx` is a `"use client"` component that wraps the vault layout. It provides `SyncProvider`, renders `VaultSidebar`, `SyncIndicator`, and `{children}`. The `app/(dashboard)/vault/layout.tsx` server component fetches data and delegates to `VaultShell`.

**Context**: `SyncProvider` uses React state/context, which requires a client component. But `layout.tsx` needs to be a server component to fetch the vault tree asynchronously.

**Alternatives considered**:

- Make `layout.tsx` a client component — loses async data fetching at the layout level.
- Thread `SyncContext` only through individual pages — works but requires every page to instantiate its own sync state; no shared indicator.

**Rationale**: The server/client split at the layout boundary is the idiomatic Next.js App Router pattern: server component fetches, client wrapper provides context. `VaultShell` is the thin bridge.

**Update (2026-05-24)**: `SyncProvider` + `VaultEditorGuardProvider` moved to `DashboardOperationProviders` in `dashboard-shell.tsx`. `VaultShell` is layout-only (sidebar + children). Status UI is no longer in `VaultShell`.

---

## 2026-05-24 — Unified app status indicator + background save as default

**Decision**: One top-right pill (`AppStatusIndicator`) aggregates GitHub writes (`SyncProvider`), Vault navigation saves (`VaultEditorGuardProvider`), and mirror sync (`VaultSyncProvider`). Routine saves use background persist + indicator; no duplicate bottom-right pill or success toasts. React modules use `useBackgroundSave()` (wraps `startSync`/`endSync` + `runBackgroundSave`).

**Context**: Four separate UX surfaces (bottom save pill, top sync dot, toasts, inline button text) overlapped and conflicted. Users expect to navigate away while saves finish.

**Alternatives considered**:

- Keep separate indicators per subsystem — simpler code but confusing UX.
- Toast-only for all saves — too easy to miss during navigation.

**Rationale**: `resolveAppStatus()` centralizes priority. `DashboardOperationProviders` wraps the full chrome so sidebar links trigger navigation background-save. `template.tsx` still owns `VaultSyncProvider` (needs per-navigation sync tick). See `DOCUMENTATION.md` → *Background save* and *UI status indicator*.

---

## 2026-05-12 — Native HTML5 Drag and Drop for vault tree (no library)

**Decision**: File drag-and-drop in `VaultTree` uses native HTML5 DnD (`draggable`, `dataTransfer`, `onDragStart/Over/Leave/Drop`). Folder-to-folder moves are file-only; dragging a folder shows an informative toast instead.

**Context**: The tree needs DnD to move files between folders. Common DnD libraries (dnd-kit, react-beautiful-dnd) add significant bundle weight and complexity for a tree that only needs file→folder moves.

**Alternatives considered**:

- dnd-kit — powerful but requires significant setup (sensors, collision detection, overlay portals) for a feature that is a nice-to-have.
- react-beautiful-dnd — deprecated/unmaintained.

**Rationale**: Native DnD is sufficient for this use case. `dataTransfer` carries `vault/path` and `vault/type`. `TreeCtx` shares the dragging state across the tree so drop targets can validate the source. Folder moves are disabled (toast explanation) because they require recursive GitHub API operations — the complexity isn't justified yet.

---

## 2026-05-12 — gitHubBase constructed server-side and passed as prop

**Decision**: Owner and repo from `getVaultConfig()` (authenticated user's `vaultGithubOwner` / `vaultGithubRepo` in Prisma) are combined into a `gitHubBase` string in `vault/layout.tsx` (server component) and threaded down as a prop through `VaultShell` → `VaultSidebar` → `VaultTree` → `TreeCtx`.

**Context**: Client components cannot access non-`NEXT_PUBLIC_` env vars. The "In Git öffnen" context menu item needs the GitHub base URL.

**Alternatives considered**:

- `NEXT_PUBLIC_VAULT_GITHUB_OWNER` / `NEXT_PUBLIC_VAULT_GITHUB_REPO` — exposes repo info to the browser bundle; acceptable for a private app but unnecessary.
- API route to retrieve the base URL — over-engineered for a static string.

**Rationale**: Constructing the URL server-side and passing it as a prop keeps sensitive config out of the client bundle while still making it available to client components via React props/context.

---

## 2026-05-12 — Types consolidated into top-level `types/` directory

**Decision**: All module-specific types moved from `lib/*/types.ts` into a top-level `types/` directory. Old files remain as re-exports for backward compatibility.

**Context**: Types were scattered across `lib/vault/types.ts`, `lib/clients/types.ts`, etc., making cross-module imports verbose and inconsistent.

**Alternatives considered**:

- Delete old files immediately — breaks any import that hasn't been updated yet.
- Keep types colocated in `lib/` — status quo, no improvement to import hygiene.

**Rationale**: Centralising types makes cross-module references shorter and the type surface easier to audit. Re-exports in the old locations avoid a big-bang migration.

---

## 2026-05-12 — Remove 6 unused Prisma models

**Decision**: `Client`, `ProductIdea`, `Project`, `TimeEntry`, `VaultIndex`, and `Verification` models removed from the Prisma schema. Migration: `npx prisma migrate dev --name drop_unused_tables`.

**Context**: These tables were created speculatively in the initial schema. Their data is now sourced from GitHub (vault) or not yet implemented (time entries, ideas use mock data).

**Alternatives considered**:

- Keep tables for future use — dead schema weight; confusing when DB layer is revisited.

**Rationale**: Removing them keeps the schema honest about what the DB actually owns (sessions + users only). Tables can be re-added when the corresponding features need real persistence.

---

## 2026-05-12 — Nav restructured into 4 named groups

**Decision**: Sidebar navigation split into: (ungrouped) Dashboard + Vault; **Ideen** group; **Arbeit** group (Kunden, Projekte, Zeiterfassung); **Einstellungen** group (Profil).

**Context**: Flat nav was growing unwieldy as modules were added. Grouping by workflow domain improves scannability.

**Alternatives considered**:

- Top-level icons only (icon sidebar) — loses discoverability for a solo-user app where labels are fine.

**Rationale**: Named groups match the mental model of "what am I doing right now" (creating ideas, doing work, changing settings). Dashboard and Vault sit ungrouped at the top because they are always-present anchors.

---

## 2026-05-12 — `/settings` deleted; merged into `/profil` as two tabs

**Decision**: `/settings` page removed. Its content lives under a new **Einstellungen** tab inside `/profil`. The sidebar **Einstellungen** group links to `/profil`.

**Context**: Two separate pages for profile and settings created unnecessary navigation jumps for a single-user app.

**Alternatives considered**:

- Keep both pages — doubles maintenance surface for essentially one concern.

**Rationale**: One page with tabs is the standard pattern for personal account management. Fewer routes to maintain.

---

## 2026-05-12 — `/profil` shows real GitHub avatar/name/email (read-only)

**Decision**: Profile data (avatar, display name, email) is fetched from the GitHub OAuth token and displayed read-only in `/profil`. No edit form.

**Context**: The app is single-user; the identity is the GitHub account used to log in. Editing profile data separately would diverge from the GitHub source of truth.

**Alternatives considered**:

- Editable profile fields stored in DB — unnecessary complexity for a personal tool.

**Rationale**: Read-only display is honest about what the app controls. Changing name/avatar means changing the GitHub profile.

---

## 2026-05-12 — Vault folder names are navigable; chevron only toggles expand

**Decision**: Clicking a folder name in the vault tree navigates to that folder's route. The chevron icon exclusively toggles the expand/collapse state.

**Context**: Previously, clicking anywhere on a folder row toggled expand without navigating. This meant folders couldn't be opened as a view.

**Alternatives considered**:

- Single click → navigate, double-click → expand — non-standard for a tree UI.
- Click → expand only — current (broken) behavior.

**Rationale**: Separating the two affordances (name = navigate, chevron = expand) follows file-manager conventions and unlocks folder-level views.

---

## 2026-05-12 — "Vault" root entry added at the top of the tree sidebar.

**Decision**: A permanent "Vault" root node is rendered at the top of `VaultTree`, linking to `/vault`.

**Context**: Without a root entry, there was no way to navigate back to the vault index from within a nested folder view.

**Rationale**: Standard file-tree UX — the root is always visible and always navigable.

---

## 2026-05-12 — Vault sidebar width is user-draggable and persisted

**Decision**: The vault sidebar has a drag handle; width is clamped 180–520 px and persisted in `localStorage` under key `vault-sidebar-width`.

**Context**: Vault files have varying tree depths and name lengths; a fixed sidebar width is either too narrow for deep paths or wastes space for shallow ones.

**Alternatives considered**:

- CSS resize property — browser native but hard to style and not cross-browser consistent.
- Fixed breakpoint widths — simpler but less flexible.

**Rationale**: Mouse-drag handle with `localStorage` persistence is the standard pattern used by VS Code and similar tools. Implementation is ~50 lines of native pointer events; no library needed.

---

## 2026-05-12 — All vault mutations are fire-and-forget (non-blocking)

**Decision**: Delete, rename, move, duplicate, and create operations update the UI immediately via optimistic state, then perform the GitHub API call in the background using `startTransition` + `router.refresh`. Errors surface via toast; the `SyncContext` indicator tracks in-flight writes.

**Context**: GitHub API writes take 500–2000 ms. Blocking the UI until each write completes made interactions feel sluggish.

**Alternatives considered**:

- Await writes before updating UI — safe but slow.
- Full optimistic UI with manual rollback on error — correct but complex rollback logic per operation type.

**Rationale**: `startTransition` defers the `router.refresh` so React keeps the UI responsive. `SyncContext` gives the user a global "saving" indicator and blocks tab close during writes. Rollback is intentionally omitted — for a personal low-stakes vault, a toast error plus a page refresh is sufficient recovery.

---

## 2026-05-12 — Mock vault data replaced with freelance designer/developer persona

**Decision**: All mock vault content updated to reflect a freelance Graphic/UX/UI + Fullstack Dev persona: clients Nova Fintech AG and Luminary Studios, Aurora Design System, FreeLens app, daily notes, and resource references. Source files live in `vault-example/`.

**Context**: The previous mock data was generic placeholder content that didn't exercise the real folder structure and frontmatter shapes the app is designed for.

**Rationale**: Realistic mock data surfaces layout edge cases (long names, nested folders, varied frontmatter) and doubles as a demo environment. `vault-example/` keeps the source separate from the app so it can be updated independently.

---

## 2026-05-12 — Client list in ProjectDialog refetches on every open

**Decision**: `ProjectDialog` calls `listClients()` server action each time the dialog opens, not once on mount.

**Context**: If the user creates a new client in another tab or session, a stale cached list would silently omit it from the project dialog's client dropdown.

**Alternatives considered**:

- Cache clients in component state — fast, but stale after out-of-band mutations.
- Global client cache with invalidation — over-engineered for a low-frequency dialog.

**Rationale**: The dialog is opened infrequently; a fresh server action call on each open costs one network round-trip and guarantees the list is current.

---

## 2026-05-12 — Per-user settings (darkMode, githubSync, autoSave) stored as DB columns with SettingsContext

**Decision**: Added `darkMode`, `githubSync`, and `autoSave` Boolean columns to the `User` model in Prisma. A `SettingsProvider` (`lib/settings-context.tsx`) exposes all six settings (the three booleans + vault repo config) via React Context. Two server actions (`app/actions/settings.ts`: `getUserSettings` / `updateUserSettings`) handle DB reads/writes. The provider is mounted at dashboard layout level (`app/(dashboard)/layout.tsx`).

**Context**: Settings were previously hardcoded or read from `.env`. As the profile page grew to include live toggles (dark mode, GitHub sync, auto-save), there was a need for a single source of truth in the DB with instant UI feedback.

**Alternatives considered**:

- Cookie-only settings — survives server restarts and needs no DB query, but can't be shared across devices or audited.
- Separate settings table — more normalized but unnecessary for a single-user app where settings live on the user row.

**Rationale**: Colocating settings on the `User` row keeps the schema minimal. The React Context layer means any component in the dashboard can read or update a setting without prop-drilling. `next-themes` integration in the provider ensures the dark-mode class on `<html>` flips immediately when the DB write confirms.

---

## 2026-05-12 — VaultService refactored from singleton to per-request factory

**Decision**: `lib/vault/index.ts` exports `createVaultService(opts)` instead of a module-level singleton. All server actions that need vault access call `getUserVaultService()` (`lib/vault/server.ts`), which reads the calling user's `githubSync` flag from the DB and returns either a real GitHub-backed service or the mock service.

**Context**: The previous singleton was constructed once at module load time with env vars. This made it impossible to respect per-user `githubSync` settings — switching sync off in the UI had no effect until a server restart.

**Alternatives considered**:

- Module-level flag checked at call time — less clean; the singleton still holds GitHub credentials regardless.
- Middleware that injects settings into request context — possible, but adds complexity to the middleware layer.

**Rationale**: A factory called per-request is the simplest way to honour the user's current `githubSync` value. `getUserVaultService()` centralises the DB lookup so every action in `app/actions/vault.ts` gets the right backend without duplicating the settings read.

---

## 2026-05-12 — Vault repo config (owner/repo/branch) on User only

**Decision**: `lib/vault/config.ts` exports `getVaultConfig()`, a server function that reads `vaultGithubOwner`, `vaultGithubRepo`, and `vaultGithubBranch` from the authenticated user's DB row only (trimmed strings; branch defaults to `main` when unset). The profil page exposes input fields for all three values. There is no `VAULT_GITHUB_*` environment fallback.

**Context**: The vault repo was previously configurable via `.env`. Per-user settings in PostgreSQL are the single source of truth so deployments do not duplicate repo identity in secrets.

**Alternatives considered**:

- Store config in `localStorage` and pass via API header — avoids a DB round-trip but not available in server actions.
- Separate `VaultConfig` table — overkill for three fields tied to one user.
- `.env` fallback for migration — removed to avoid two sources of truth; configure once in **Profil** after deploy.

**Rationale**: DB columns on `User` keep vault targeting explicit and editable without redeploying. `getVaultConfig()` is called from `app/actions/github.ts` and `vault/layout.tsx` (for `gitHubBase`), keeping the lookup centralised.

---

## 2026-05-23 — Multi-user workspace architecture (Workspace as the unit of collaboration)

**Decision**: Introduce `Workspace` as the central entity replacing per-`User` vault config. Every user gets a personal workspace on registration. Team workspaces can be created and shared. All data (vault config, sync state, file mirrors, pages, members) lives on the workspace.

**Context**: The app was single-admin. As multi-user collaboration became a goal, the `User` row was too narrow — it conflated identity with vault config. Two users can't share a vault because the sync state was stored on the user.

**Alternatives considered**:
- Keep per-user config with a "shared user" account — a hack; doesn't scale to real multi-user.
- Separate `VaultConfig` model linked to `User` — a stepping stone, but doesn't enable team workspaces.

**Rationale**: The `Workspace` model matches the mental model of an Obsidian vault: one GitHub repo, one set of pages, multiple members with roles. Personal workspaces are created automatically; team workspaces are created explicitly. The `WorkspaceMember` join table handles roles (OWNER/ADMIN/MEMBER/VIEWER).

---

## 2026-05-23 — WorkspaceContextHost: client-side workspace context sync via x-pathname header

**Decision**: Workspace context for the sidebar is provided by a server component (`DashboardWorkspaceBoundary`) that reads the `x-pathname` header (set by middleware for every request) to determine the current workspace slug. It resolves workspace data server-side and passes it to `WorkspaceContextHost` (a client component) which holds it in state and re-fetches via server action when the URL slug changes on client navigations.

**Context**: `AppSidebar` lives in `DashboardShell` (inside `(dashboard)/layout.tsx`) — a level above the `w/[workspaceSlug]/layout.tsx` where the `WorkspaceProvider` was originally placed. In Next.js App Router, parent layout components cannot be inside a child layout's providers. The sidebar therefore always got `null` from `useWorkspace()`.

**Alternatives considered**:
- Route group restructuring: move sidebar into `w/[workspaceSlug]/layout.tsx` and create a separate `(shell)/layout.tsx` for non-workspace routes — correct but requires moving many page files.
- Client-only bootstrap: read pathname on the client, fetch workspace data, accept a loading flash — simpler but worse UX.

**Rationale**: The `x-pathname` header approach resolves workspace data on the server for the initial render (no flash, no loading state) while `WorkspaceContextHost`'s `useEffect` keeps it in sync on subsequent client-side navigations. Middleware already sets `x-pathname` on every request, so no new infrastructure was needed.

---

## 2026-05-23 — Workspace pages are configurable templates, reusable multiple times

**Decision**: Each `WorkspacePage` row has a `templateKey` (e.g. `"aufgaben"`) that determines which React component renders it, and a `slug` that determines the URL. Multiple pages of the same template type are allowed (e.g. two separate "Aufgaben" pages pointing to different vault folders). Slug conflicts are resolved automatically by appending `-2`, `-3`, etc.

**Context**: Originally the pages manager filtered out templates already in use, enforcing one-page-per-template. Users want to split content across multiple pages of the same type (e.g. separate task boards per project, each backed by a different vault subfolder).

**Alternatives considered**:
- One page per template strictly — simpler but inflexible.
- Free-form page types without templates — too open; loses the component routing mechanism.

**Rationale**: Template keys are the routing mechanism (mapped in `[pageSlug]/page.tsx` to React components). Allowing reuse with different slugs and `dataFolder` configs gives flexible workspace layouts without duplicating component code. The slug deduplication in `addWorkspacePage` is a server-side guard so the database `@@unique([workspaceId, slug])` constraint is never violated.

---

## 2026-05-23 — Workspace settings and pages management consolidated on one page

**Decision**: The separate `/w/[slug]/settings/pages` route was removed. Page management (`WorkspacePagesManager`) is embedded directly in `/w/[slug]/settings`, alongside workspace name, GitHub config, and member management.

**Context**: The settings page previously had a card linking to a separate pages route. The user had to click through to reach page configuration. For a settings panel with ~6 pages, this extra navigation is unnecessary friction.

**Rationale**: A single long-scroll settings page is easier to discover and faster to use. All workspace configuration (identity, vault sync, members, pages) is in one place. The `/settings/pages` route is kept as a redirect for any bookmarked links.

---

<!-- Template for new entries:

## YYYY-MM-DD — Short decision title

**Decision**: ...

**Context**: ...

**Alternatives considered**:
- ...

**Rationale**: ...

-->
