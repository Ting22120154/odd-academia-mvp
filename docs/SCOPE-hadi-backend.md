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

## Not in this PR

- Notifications, like/save APIs (later)
- UI pages (`home`, `paper`) — still use mock on `main` until frontend wires `/api/comments`
- `schema.prisma` edits (DB lead only)
