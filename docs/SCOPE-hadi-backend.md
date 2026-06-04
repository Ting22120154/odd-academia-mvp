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

## Comment likes

```
comment_likes table in schema.prisma
POST/DELETE /api/comments/:id/like
likesCount + likedByMe on GET comments (when logged in)
```

## Not in this PR

- Paper like APIs (later)
- Notification settings persisted to DB (UI still local)
- UI pages (`home`, `paper`) — still use mock on `main` until frontend wires `/api/comments`
- `schema.prisma` edits (DB lead only)
