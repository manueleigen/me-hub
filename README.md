# MeHub App

Next.js personal hub: vault browser, time tracking, product ideas, clients — backed by **PostgreSQL (Prisma)** and optional **GitHub** sync for Markdown content.

For deeper architecture and module notes, see [DOCUMENTATION.md](./DOCUMENTATION.md).

---

## Prerequisites

Before you run the app, line these up:

| Requirement | Why |
| ----------- | --- |
| **PostgreSQL database** | Prisma persists users, sessions, and settings (`DATABASE_URL`). |
| **GitHub account** | Sign-in uses **GitHub OAuth** only (`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`). |
| **GitHub OAuth App** | Lets users log in via GitHub; set the callback URL to your app (see below). |
| **GitHub personal access token** | Server-side API access for the vault (`GITHUB_TOKEN`) — **not** the OAuth secret. |
| **Vault Git repository** | A repo holding your Markdown vault; owner, name, and branch are stored on your **User** row and edited under **Profil**. |

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root (never commit it). Minimum:

```bash
# Database (Prisma) — PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# GitHub API — fine-grained or classic PAT with repo access to your vault repository
GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# GitHub OAuth — from GitHub → Settings → Developer settings → OAuth Apps
GITHUB_CLIENT_ID="xxxxxxxxxxxx"
GITHUB_CLIENT_SECRET="xxxxxxxxxxxx"

# App URL — must match where the app is served (used by the auth client)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

In production, set a strong secret for Better Auth if your deployment requires it (see [Better Auth environment](https://www.better-auth.com/docs/installation)).

### 3. GitHub OAuth App

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. **Application name**: e.g. MeHub (local).
3. **Homepage URL**: same origin as `NEXT_PUBLIC_APP_URL`.
4. **Authorization callback URL**:  
   `{NEXT_PUBLIC_APP_URL}/api/auth/callback/github`  
   Example local: `http://localhost:3000/api/auth/callback/github`.
5. Copy **Client ID** and generate a **Client secret** into `.env`.

### 4. GitHub token (`GITHUB_TOKEN`)

Create a **Personal Access Token** (fine-grained or classic) that can read/write the vault repo (contents). The server uses it for GitHub API calls (Octokit), separate from OAuth client credentials.

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

Those values are read from the **User** row in PostgreSQL (`vaultGithubOwner`, `vaultGithubRepo`, `vaultGithubBranch` in Prisma). Enable **GitHub Sync** in the same area when you want the app to use the live repo (see `features.githubSync` in `lib/config.ts`).

---

## Environment reference

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `DATABASE_URL` | Yes | Prisma / PostgreSQL |
| `GITHUB_TOKEN` | Yes for vault API | Server-side GitHub API |
| `GITHUB_CLIENT_ID` | Yes | OAuth login |
| `GITHUB_CLIENT_SECRET` | Yes | OAuth login |
| `NEXT_PUBLIC_APP_URL` | Yes | Auth client base URL + OAuth callback origin |

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` / `npm run typecheck` | Quality checks |

---

## Markdown vault (content layer)

The **MeHub** system treats a Git repository as the source of truth for Markdown modules (time entries, clients, ideas, etc.). This repository is the **web app**; your vault can live in a separate GitHub repo configured above. Folder layouts and frontmatter conventions are described in [AGENTS.md](./AGENTS.md) for AI-assisted editing.

---

## Further reading

- [DOCUMENTATION.md](./DOCUMENTATION.md) — stack, routes, feature flags  
- [CONCEPT.md](./CONCEPT.md) — product vision  
- [DECISIONS.md](./DECISIONS.md) — architecture decisions  
