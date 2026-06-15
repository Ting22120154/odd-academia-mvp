# Odd Academia

[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=23154733)

A web platform where students and early-career researchers can publish academic work, build a public profile, and engage with others through comments, follows, and moderation tools.

**Course:** COMP3018 PX · **Team:** PA2609 · **Client:** Se-on (Odd Academia)

---

## Table of contents

- [What this project does](#what-this-project-does)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment notes](#deployment-notes)
- [Documentation](#documentation)
- [Team](#team)

---

## What this project does

Odd Academia is an MVP academic portfolio platform. Users can:

- Register, verify email, and complete an onboarding profile
- Upload papers (PDF) with abstract, categories, contributors, and references
- View papers in-browser, comment, follow authors/papers, and receive notifications
- Edit their profile (work status, interests, bio, avatar, social links)
- Report content for moderation

Admins use a separate panel to review reports, manage users and papers, and view dashboard metrics.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | [Next.js](https://nextjs.org/) 16, React 19, TypeScript |
| Admin | Next.js (separate app on port 3001) |
| Database | [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/) |
| ORM | [Prisma](https://www.prisma.io/) (shared in `packages/db`) |
| Auth | JWT (HTTP-only cookies) |
| File storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (PDFs & avatars in production) |
| Email | Gmail SMTP (verification & notifications) |
| Monorepo | [pnpm](https://pnpm.io/) workspaces + [Turborepo](https://turbo.build/) |
| Testing | Vitest (unit/integration), Playwright (E2E) |
| CI | GitHub Actions (`.github/workflows/test.yml`) |

---

## Repository structure

```
odd-academia/
├── frontend/          # Public app — home, papers, profiles, upload (port 3000)
├── admin/             # Admin panel — moderation, users, papers (port 3001)
├── packages/
│   └── db/            # Prisma schema, migrations, seed data, shared client
├── docs/              # Project charter, API notes, handover plan
├── e2e/               # Playwright end-to-end tests
├── .github/workflows/ # CI pipelines
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Why a monorepo?** The frontend and admin share one database schema and Prisma client. Keeping them in one repo avoids schema drift and makes migrations easier for the team.

---

## Prerequisites

Install these before you start:

| Tool | Version | Notes |
|------|---------|--------|
| [Node.js](https://nodejs.org/) | 20+ | LTS recommended |
| [pnpm](https://pnpm.io/) | 10+ | `npm install -g pnpm` |
| PostgreSQL | — | Optional locally; we use Neon in dev/production |

You do **not** need Docker for normal development if you use a cloud Neon database.

---

## Getting started

All commands below are run from the **repository root**.

### 1. Clone and install

```bash
git clone https://github.com/Ting22120154/group-team-odd-academia.git
cd group-team-odd-academia
pnpm install
```

### 2. Configure environment variables

Copy the example files and fill in real values (see [Environment variables](#environment-variables)).

```bash
# macOS / Linux / Git Bash
cp frontend/.env.example frontend/.env.local
cp admin/.env.example admin/.env.local
cp packages/db/.env.example packages/db/.env
```

```powershell
# Windows PowerShell
Copy-Item frontend/.env.example frontend/.env.local
Copy-Item admin/.env.example admin/.env.local
Copy-Item packages/db/.env.example packages/db/.env
```

Ask a teammate for shared Neon / JWT values, or create your own Neon project at [neon.tech](https://neon.tech).

### 3. Apply the database schema

```bash
pnpm db:push
```

This syncs the Prisma schema in `packages/db/prisma/schema.prisma` to your database.

### 4. (Optional) Seed sample data

```bash
pnpm db:seed
```

> **Warning:** `db:seed` clears existing data in the database before inserting demo users and related records. Do not run this on a shared production database.

Default admin login after seeding:

| Field | Value |
|-------|--------|
| Email | `admin@oddacademia.com` |
| Password | `Admin@1234` |

### 5. Start development servers

```bash
pnpm dev
```

| App | URL |
|-----|-----|
| Frontend | http://localhost:3000 |
| Admin | http://localhost:3001 |

---

## Environment variables

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Long random string for signing session tokens |
| `GMAIL_USER` | Yes* | Gmail address for outbound email |
| `GMAIL_APP_PASSWORD` | Yes* | [Gmail App Password](https://support.google.com/accounts/answer/185833) (not your normal login password) |
| `BLOB_STORE_ID` | Production | Set automatically when Vercel Blob is linked to the project |
| `BLOB_READ_WRITE_TOKEN` | Alternative | Manual Blob token if not using Vercel OIDC |

\*Email can be skipped for some local work, but registration verification will not send.

### Admin (`admin/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Same database as the frontend |
| `JWT_SECRET` | Yes | Must match the frontend secret |

### Database package (`packages/db/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Used by Prisma CLI (`db:push`, `db:seed`, `db:studio`) |

**Security:** Never commit `.env`, `.env.local`, or real secrets to Git. Example files (`.env.example`) are safe to commit.

---

## Scripts

Run from the repository root:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend + admin in development mode |
| `pnpm build` | Production build for all apps |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm db:push` | Push Prisma schema to the database |
| `pnpm db:seed` | Reset and seed demo data |
| `pnpm db:studio` | Open Prisma Studio (visual DB browser) |
| `pnpm db:generate` | Regenerate Prisma Client after schema changes |
| `pnpm test` | Unit + integration tests |
| `pnpm test:unit` | Unit tests only |
| `pnpm test:integration` | Integration tests (needs `DATABASE_URL`) |
| `pnpm test:e2e` | Playwright E2E tests (build + running servers required) |

---

## Testing

The project uses a three-layer test strategy:

1. **Unit tests** — fast checks for utilities, validators, and mappers (`pnpm test:unit`)
2. **Integration tests** — API routes against a real Postgres database (`pnpm test:integration`)
3. **E2E tests** — browser flows with Playwright (`pnpm test:e2e`)

CI runs automatically on pushes and pull requests to `main` (see `.github/workflows/test.yml`).

To run integration or E2E tests locally, set `DATABASE_URL` and `JWT_SECRET` in your env files, then run `pnpm db:push` before testing.

---

## Deployment notes

Production is hosted on **Vercel** with:

- **Neon** — PostgreSQL database
- **Vercel Blob** — private storage for PDF uploads and profile images

High-level deploy checklist for maintainers:

1. Connect the GitHub repo to Vercel (frontend and admin as separate projects or monorepo targets).
2. Set environment variables in the Vercel dashboard (`DATABASE_URL`, `JWT_SECRET`, Gmail, Blob).
3. Run `pnpm db:push` against the production database when the schema changes.
4. Verify file uploads and avatar URLs after deploy.

Day-to-day platform use (moderation, uploads, profile edits) does not require running code locally. See `docs/Handover-Plan.md` for client handover details.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/Project-Charter.md`](docs/Project-Charter.md) | Scope, objectives, milestones |
| [`docs/Risks-Constraints.md`](docs/Risks-Constraints.md) | Risks and constraints |
| [`docs/Communication-Plan.md`](docs/Communication-Plan.md) | Team communication plan |
| [`docs/Handover-Plan.md`](docs/Handover-Plan.md) | Client deliverables and handover |
| [`docs/api-comments.md`](docs/api-comments.md) | Comments API notes |
| [`docs/api-notifications.md`](docs/api-notifications.md) | Notifications API notes |
| [`frontend/AUTH_API.md`](frontend/AUTH_API.md) | Auth and user API overview |

---

## Team

| Name | Role |
|------|------|
| Ting-An Wang | — |
| Talha Ahmed | — |
| Rohit Bhattarai | — |
| Hamim Hadi Riyaz Kidavintavida | — |

**Academic supervisor:** Dr. Tad Bak  
**Client:** Se-on (Odd Academia)

---

## License

This project was developed as part of an academic coursework submission. Contact the team or client before reusing or redistributing the codebase.
