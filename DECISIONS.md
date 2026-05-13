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

<!-- Template for new entries:

## YYYY-MM-DD — Short decision title

**Decision**: ...

**Context**: ...

**Alternatives considered**:
- ...

**Rationale**: ...

-->
