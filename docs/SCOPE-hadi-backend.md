# Hadi — comments API only (current PR)

**No mock data.** All comment text, authors, and dates come from Neon (`comments` + `users` tables).

## Files in this PR

```
app/api/comments/route.ts
app/api/comments/[id]/route.ts
app/api/comments/paper/[id]/route.ts

modules/comments/
lib/prisma.ts
lib/auth/session.ts
lib/api/response.ts

docs/api-comments.md
frontend/package.json (+ @prisma/client)
packages/db/package.json (+ ./server export)
```

## Saved papers API (same branch / follow-up commit)

```
app/api/papers/[id]/save/route.ts   — GET status, POST save, DELETE unsave
app/api/saved-papers/route.ts       — GET list + count

modules/saved-papers/
packages/db/prisma/schema.prisma    — PaperSave model (coordinate with DB lead)
docs/api-saved-papers.md
```

## Notifications API

```
app/api/notifications/route.ts
app/api/notifications/[id]/read/route.ts
app/api/notifications/read-all/route.ts
modules/notifications/
lib/notifications-client.ts
docs/api-notifications.md
```

Comment/reply creation triggers notification rows via `comment.service.ts`.

## Not in this PR

- Paper like APIs (later)
- Notification settings persisted to DB (UI still local)
- UI pages (`home`, `paper`) — still use mock on `main` until frontend wires `/api/comments`
- `schema.prisma` edits (DB lead only)
