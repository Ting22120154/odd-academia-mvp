# PR: Comments API (Person 3)

## Summary

Implements the **Comments API** for Odd Academia using **PostgreSQL (Neon)** and Prisma. All comment data is read/written from the `comments` and `users` tables — **no mock or hardcoded comment lists** in this PR.

Does **not** change `schema.prisma`, UI pages, notifications, or paper like/save.

## API Endpoints

| Method | Endpoint | Auth | Responsibility |
|--------|----------|------|----------------|
| `POST` | `/api/comments` | Required | Add top-level comment or threaded reply |
| `GET` | `/api/comments/paper/:id` | Public | List comments for a paper (nested `replies`) |
| `PUT` | `/api/comments/:id` | Author only | Edit own comment |
| `DELETE` | `/api/comments/:id` | Author only | Soft-delete (`is_hidden = true`) |

**Auth (until real auth):** cookie `auth-user-id` or header `X-User-Id` (Neon `users.id` UUID).

## File checklist

### API routes

- [x] `frontend/src/app/api/comments/route.ts` — POST
- [x] `frontend/src/app/api/comments/paper/[id]/route.ts` — GET threaded list
- [x] `frontend/src/app/api/comments/[id]/route.ts` — PUT, DELETE

### Module

- [x] `frontend/src/modules/comments/comment.service.ts` — Prisma CRUD + threading
- [x] `frontend/src/modules/comments/comment.validation.ts` — UUID + content validation
- [x] `frontend/src/modules/comments/types.ts` — request/response types

### Shared lib

- [x] `frontend/src/lib/prisma.ts` — `@odd-academia/db/server`
- [x] `frontend/src/lib/auth/session.ts` — `requireAuthUser()`
- [x] `frontend/src/lib/api/response.ts` — `jsonOk` / `jsonError`

### Config

- [x] `frontend/package.json` — `@prisma/client`, `db:generate`
- [x] `packages/db/package.json` — export `./server`
- [x] `pnpm-lock.yaml`

### Docs

- [x] `docs/api-comments.md`
- [x] `docs/SCOPE-hadi-backend.md`

## Not in this PR

- `schema.prisma` edits
- UI (`PaperDetailClient`, etc.)
- Notifications, like/save APIs
- Legacy `app/api/posts/[id]/comments` (mock on main)

## Test plan

1. `pnpm install` · `pnpm --filter frontend db:generate` · `pnpm db:seed`
2. `DATABASE_URL` in `packages/db/.env` and `frontend/.env.local`
3. `pnpm --filter frontend dev`
4. `GET /api/comments/paper/:paperUuid`
5. `POST /api/comments` with `X-User-Id: :userUuid`
6. `PUT` / `DELETE` as author

## Team dependencies

| Need | Owner |
|------|-------|
| Real `users.id` on login | Rohit |
| Paper URLs use Neon UUIDs | Talha |
| Wire paper UI to API | Ting |
