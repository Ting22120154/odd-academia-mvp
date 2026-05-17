[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=23154733)

## Odd Academia (COMP3018 PX)
This repository contains the project documentation and implementation for **Odd Academia MVP** (Group **PA2609**).

## Documentation
Start here:
- `docs/Project-Charter.md`
- `docs/Risks-Constraints.md`
- `docs/Communication-Plan.md`
- `docs/Handover-Plan.md`

> Note: `docs/Project-Charter.md` is the Markdown version of your submitted `PROJECT CHARTER Draft.pdf`.

---

## Monorepo Structure

```
odd-academia/
├── admin/          # Admin panel (Next.js, port 3001)
├── frontend/       # Public-facing app (Next.js, port 3000)
├── packages/
│   └── db/         # Shared Prisma client, schema, seed data
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+ — install with `npm i -g pnpm`

## Setup

### 1. Install dependencies (run from repo root)

```bash
pnpm install
```

### 2. Set up environment variables

Each app has a `.env.example` file. Copy it and fill in your values:

```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Admin
cp admin/.env.example admin/.env.local

# Shared DB package (needed for Prisma CLI commands)
cp packages/db/.env.example packages/db/.env
```

**Environment variables you need:**

| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | frontend, admin, packages/db | Neon PostgreSQL connection string |
| `JWT_SECRET` | frontend, admin | Secret for signing JWT tokens |
| `GMAIL_USER` | frontend | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | frontend | Gmail App Password (not your login password) |

> Ask a teammate for the shared Neon database URL and JWT secret, or create your own Neon project at [neon.tech](https://neon.tech).

### 3. Push the database schema

```bash
pnpm db:push
```

### 4. Seed the database (optional — loads sample data)

> **Warning:** This command deletes all existing data before inserting.
> Do not run on a shared Neon instance unless everyone on the team is okay
> with losing their current data.

```bash
pnpm db:seed
```

### 5. Run both apps simultaneously

```bash
pnpm dev
```

This uses Turborepo to start:
- **Frontend** at [http://localhost:3000](http://localhost:3000)
- **Admin panel** at [http://localhost:3001](http://localhost:3001)

### Admin panel credentials (after seeding)

| Field | Value |
|---|---|
| Email | `admin@oddacademia.com` |
| Password | `Admin@123` |

---

## Useful Commands

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm db:push` | Push Prisma schema to the database |
| `pnpm db:seed` | Seed the database with sample data |
| `pnpm db:studio` | Open Prisma Studio (DB browser) |
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
