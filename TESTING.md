# Testing

Odd Academia uses **Vitest** (unit + integration) and **Playwright** (E2E).

## Commands (repo root)

```bash
pnpm test              # unit + integration (frontend + admin)
pnpm test:unit         # Vitest unit tests only
pnpm test:integration  # Vitest API/DB tests
pnpm test:e2e          # Playwright (servers must be running)
```

## Unit tests

- Location: `frontend/tests/unit`, `admin/tests/unit`
- No database required.
- Covers auth helpers, validation, mappers, notification grouping, seed/category consistency.

## Integration tests

- Location: `frontend/tests/integration`, `admin/tests/integration`
- Requires `DATABASE_URL` in `frontend/.env.local` (or `TEST_DATABASE_URL`).
- Uses a real Postgres database; tests create/delete users with `@test.local` emails.
- If no DB URL is set, DB-dependent suites are **skipped** automatically.

## E2E tests

- Location: `e2e/frontend`, `e2e/admin`
- Start apps first:

```bash
pnpm --filter frontend dev    # http://127.0.0.1:3000
pnpm --filter admin dev       # http://127.0.0.1:3001
pnpm test:e2e
```

Optional env for logged-in frontend E2E:

```bash
E2E_USER_EMAIL=you@example.com
E2E_USER_PASSWORD=yourpassword
```

Admin login E2E defaults to seed credentials (`admin@oddacademia.com` / `Admin@1234`).

## CI suggestion

1. `pnpm test:unit` — always
2. `pnpm test:integration` — with ephemeral Postgres + `pnpm db:push`
3. `pnpm test:e2e` — after `next build && next start` or against preview URLs
