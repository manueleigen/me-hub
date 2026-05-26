# MeHub App

Next.js personal hub: vault browser, time tracking, product ideas, clients — backed by **PostgreSQL (Prisma)** and **GitHub** sync for Markdown content.

The app mirrors your vault repo into Postgres for fast reads, keeps the mirror in sync with GitHub, and shows sync status in the UI.

For deeper architecture and module notes, see [DOCUMENTATION.md](./DOCUMENTATION.md).

---

## Prerequisites

Before you run the app, line these up:

| Requirement                      | Why                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **PostgreSQL database**          | Prisma persists users, sessions, settings, and the vault mirror (`DATABASE_URL`).                                        |
| **GitHub account**               | Sign-in uses **GitHub OAuth** only (`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`).                                        |
| **GitHub OAuth App**             | Lets users log in via GitHub; set the callback URL to your app (see below).                                              |
| **Vault Git repository**         | A repo holding your Markdown vault; per workspace configure owner, name, branch, and PAT under **Workspace → Einstellungen → GitHub Vault**. |

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` in the project root (never commit `.env`). Minimum:

```bash
# Database (Prisma) — PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# GitHub OAuth — from GitHub → Settings → Developer settings → OAuth Apps
GITHUB_CLIENT_ID="xxxxxxxxxxxx"
GITHUB_CLIENT_SECRET="xxxxxxxxxxxx"

# App URL — must match where the app is served (used by the auth client)
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Vault webhook (same secret as in GitHub → Repo → Settings → Webhooks)
# Generate: openssl rand -hex 32
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
```

Optional for **local webhook forwarding** via [smee.io](https://smee.io):

```bash
SMEE_SOURCE_URL="https://smee.io/me-hub-vault-git-sync"
SMEE_TARGET_URL="http://localhost:3000/api/webhook/github"
```

In production, set a strong `BETTER_AUTH_SECRET` (see [Better Auth environment](https://www.better-auth.com/docs/installation)).

### 3. GitHub OAuth App

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. **Application name**: e.g. MeHub (local).
3. **Homepage URL**: same origin as `NEXT_PUBLIC_APP_URL`.
4. **Authorization callback URL**:  
   `{NEXT_PUBLIC_APP_URL}/api/auth/callback/github`  
   Example local: `http://localhost:3000/api/auth/callback/github`.
5. Copy **Client ID** and generate a **Client secret** into `.env`.

### 4. Workspace GitHub token (per vault)

After sign-in, open **Workspace → Einstellungen → GitHub Vault**. Create a **Personal Access Token** (fine-grained or classic) scoped to that workspace’s vault repo only, and save it there. The server validates access to Owner/Repo and encrypts it in the database.

In **production** (`NODE_ENV=production`), you **must** set `GITHUB_TOKEN_ENCRYPTION_KEY` (separate from `BETTER_AUTH_SECRET`) — otherwise saving a PAT will fail.

In development, PAT encryption may fall back to `BETTER_AUTH_SECRET`.

### 5. Apply database migrations

```bash
npx prisma migrate dev
```

For production or CI, use `npx prisma migrate deploy` against the same `DATABASE_URL`.

### 6. Start the dev server

```bash
npm run dev
```

Open the URL you set in `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`).

### 6. GitHub Sync with smee

```bash
npx smee-client -u https://smee.io/me-hub-vault-git-sync -t http://localhost:3000/api/webhook/github
```

---

## Vault GitHub sync

### How it works

1. **Read path**: The vault tree mirrors **text files** (`.md`, `.txt`, `.json`, `.html`, `.csv`, extensionless, … — no binaries). Module pages (Produkt-Ideen, Kunden, …) still list **`.md` only** from that mirror.
2. **Write path**: Saves go to GitHub via the API and update the mirror row immediately.
3. **Background sync**: Compares the configured branch tip SHA with `lastSyncedSha`, applies incremental changes, and reconciles orphaned mirror files against the remote tree.
4. **UI**: A pill in the top-right shows sync state (yellow → purple → green / red). After sync, the page refreshes automatically when data changed.

### When sync runs automatically

| Trigger                                  | Mechanism                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| Dashboard navigation                     | `router.refresh()` only (reads Postgres mirror; no GitHub)                       |
| Tab focus after hidden                   | `checkVaultRemote()` → full pull only if branch tip changed                      |
| After app writes                         | `requestSyncAfterWrite()` (Vault, Clients, Produkt-Ideen, Aufgaben)              |
| GitHub push (Obsidian Git, web UI, etc.) | `POST /api/webhook/github` → server pull; UI polls snapshot (~12s) and refreshes |

Set `NEXT_PUBLIC_VAULT_WEBHOOK_ENABLED=false` in `.env` for local dev without webhook (30s poll, focus check as fallback).

### GitHub webhook (production)

In your **vault repository** → **Settings** → **Webhooks** → **Add webhook**:

| Field        | Value                                     |
| ------------ | ----------------------------------------- |
| Payload URL  | `https://<your-app>/api/webhook/github`   |
| Content type | `application/json`                        |
| Secret       | Same as `GITHUB_WEBHOOK_SECRET` in `.env` |
| Events       | **Push events** only                      |

Health check: `GET /api/webhook/github` returns `{ ok: true }`.

### Local webhook (smee.io)

GitHub cannot reach `localhost`. Use a smee channel and the included forwarder:

1. Create a channel at [smee.io](https://smee.io) (e.g. `https://smee.io/me-hub-vault-git-sync`).
2. Set that URL as the webhook **Payload URL** in GitHub.
3. Run two terminals:

```bash
# Terminal A — app
npm run dev

# Terminal B — forward smee → local API
npm run dev:smee
```

`dev:smee` runs `scripts/smee-webhook-forward.ts` using the **`smee-client`** package (not `smee.io` on npm).

After a push, check the **Next.js terminal** for lines like:

```text
[vault-sync] webhook push owner/repo@main — scheduling mirror sync
[vault-sync] webhook sync done …
```

### Manual full resync

**Profil** → **Vault-Daten (Cache)** → **Cache leeren & Vault neu laden** — deletes the mirror and runs a full import from GitHub.

### Troubleshooting sync

| Symptom                         | Check                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| Webhook `401 Invalid signature` | `GITHUB_WEBHOOK_SECRET` must match GitHub webhook secret exactly                    |
| Webhook `503`                   | `GITHUB_WEBHOOK_SECRET` missing in `.env`                                           |
| Smee runs, app silent           | `npm run dev` running? Target must be `/api/webhook/github` (see `SMEE_TARGET_URL`) |
| UI stale after GitHub delete    | Wait for sync indicator (green) or reload; open app tab to trigger focus sync       |
| No users synced on webhook      | Profil: owner/repo/branch must match the pushed repo and branch                     |

Server logs use the prefix **`[vault-sync]`**.

---

## Access control: single admin

- The **first** GitHub user who completes sign-up becomes **`admin`** (enforced in `lib/auth.ts`).
- **Every further sign-up is rejected** — the platform is treated as closed after the first account exists.

If you need another person later, add them by extending your auth logic or resetting the database during development — there is no self-service registration for user #2.

---

## Vault repository configuration

After logging in, open **Profil** (`/profil`). Under **GitHub Vault Konfiguration**, set:

- **GitHub Owner**
- **Repository**
- **Branch**

Those values are read from the **User** row in PostgreSQL (`vaultGithubOwner`, `vaultGithubRepo`, `vaultGithubBranch`). Enable **GitHub Sync** in the same area when you want the app to use the live repo and mirror (per-user flag `githubSync` on `User`).

---

## Environment reference

| Variable                | Required          | Purpose                                                             |
| ----------------------- | ----------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`          | Yes               | Prisma / PostgreSQL                                                 |
| `GITHUB_CLIENT_ID`      | Yes               | OAuth login                                                         |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | **Prod (PAT)** | Required in production to store workspace PATs (`NODE_ENV=production`). Dev may use `BETTER_AUTH_SECRET` fallback. |
| `GITHUB_CLIENT_SECRET`  | Yes               | OAuth login                                                         |
| `BETTER_AUTH_URL`       | Yes               | Better Auth base URL                                                |
| `NEXT_PUBLIC_APP_URL`   | Yes               | Auth client + OAuth callback origin                                 |
| `BETTER_AUTH_SECRET`    | Prod              | Session signing                                                     |
| `GITHUB_WEBHOOK_SECRET` | For webhooks      | HMAC verification on push events                                    |
| `SMEE_SOURCE_URL`       | Local dev         | smee.io channel URL                                                 |
| `SMEE_TARGET_URL`       | Local dev         | Forward target (default `http://localhost:3000/api/webhook/github`) |
---

## Scripts

| Command                              | Description                                             |
| ------------------------------------ | ------------------------------------------------------- |
| `npm run dev`                        | Next.js dev server (Turbopack)                          |
| `npm run dev:smee`                   | Forward smee.io webhooks to local `/api/webhook/github` |
| `npm run build`                      | Production build                                        |
| `npm run start`                      | Run production server                                   |
| `npm run lint` / `npm run typecheck` | Quality checks                                          |

---

## Markdown vault (content layer)

The **MeHub** system treats a Git repository as the source of truth for Markdown modules (time entries, clients, ideas, etc.). This repository is the **web app**; your vault can live in a separate GitHub repo configured above. Folder layouts and frontmatter conventions are described in [AGENTS.md](./AGENTS.md) for AI-assisted editing.

---

## Further reading

- [DOCUMENTATION.md](./DOCUMENTATION.md) — stack, routes, vault sync architecture
- [CONCEPT.md](./CONCEPT.md) — product vision
- [DECISIONS.md](./DECISIONS.md) — architecture decisions
- [.env.example](./.env.example) — all environment variables with comments
