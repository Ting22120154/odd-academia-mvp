# Comments API contract

> **Full contracts (comments + notifications + planned like/save):** see [`api-contracts-person3.md`](./api-contracts-person3.md) — use that file for team sign-off (Rule 2).

Owner: **Hadi (Person 3 — Phase 2)**  
Auth bridge until real auth ships: cookie `auth-user-id` (set on login) or header `X-User-Id`.

All success responses: `{ "success": true, ... }`  
All errors: `{ "success": false, "error": "message" }`

---

## POST `/api/comments`

Create a top-level comment or a reply.

**Auth:** required

**Request body:**

```json
{
  "paperId": "uuid",
  "content": "string (1–10000 chars)",
  "parentCommentId": "uuid (optional — reply)",
  "citation": "string (optional, UI only for now)"
}
```

**Success `201`:**

```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "paperId": "uuid",
    "user": { "id": "uuid", "fullName": "string", "avatarUrl": "string?" },
    "content": "string",
    "likesCount": 2,
    "likedByMe": false,
    "replies": [],
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601",
    "status": "ACTIVE"
  }
}
```

**Errors:** `400` validation · `401` unauthorized · `404` paper or parent not found · `500` server

**Data source:** all comment fields come from PostgreSQL (`comments` + `users` + `comment_likes`). No mock arrays. `likedByMe` is included when the request sends `auth-user-id` (cookie or `X-User-Id`).

---

## GET `/api/comments/paper/:id`

Threaded comment list for one paper (roots with nested `replies`).

**Auth:** none (public read)

**Success `200`:**

```json
{
  "success": true,
  "comments": [ "CommentResponse[]" ]
}
```

**Errors:** `400` invalid UUID · `404` paper not found · `500` server

Hidden comments (`isHidden`) are omitted.

---

## PUT `/api/comments/:id`

Edit own comment.

**Auth:** required (must be author)

**Request body:**

```json
{
  "content": "string (1–10000 chars)",
  "citation": "string (optional)"
}
```

**Success `200`:** `{ "success": true, "comment": CommentResponse }`

**Errors:** `400` · `401` · `403` not owner · `404` · `500`

---

## POST `/api/comments/:id/like`

Like a comment (idempotent).

**Auth:** required

**Success `201`:** `{ "success": true, "commentId": "uuid", "liked": true, "likesCount": 1 }`

---

## DELETE `/api/comments/:id/like`

Remove your like.

**Auth:** required

**Success `200`:** `{ "success": true, "commentId": "uuid", "liked": false, "likesCount": 0 }`

---

## DELETE `/api/comments/:id`

Soft-delete own comment (`isHidden: true`, `status: "REMOVED"` in API shape).

**Auth:** required (must be author)

**Success `200`:** `{ "success": true, "deleted": true }`

**Errors:** `401` · `403` · `404` · `500`

---

## Code layout (Rule 3 & 4)

| Layer | Path |
|-------|------|
| Routes | `frontend/src/app/api/comments/` |
| Service | `frontend/src/modules/comments/comment.service.ts` |
| Validation | `frontend/src/modules/comments/comment.validation.ts` |
| Types | `frontend/src/modules/comments/types.ts` |
| Prisma | `frontend/src/lib/prisma.ts` |
| Auth | `frontend/src/lib/auth/session.ts` |

**Schema:** `packages/db/prisma/schema.prisma` — **DB lead only** (no edits on feature branches).

---

## Local testing

1. `pnpm install` (repo root)
2. `pnpm --filter @odd-academia/db db:generate` and `db:push` / `db:seed`
3. `pnpm dev` in `frontend`
4. Open `/paper/<seeded-paper-uuid>` (not mock `post-1` ids)
5. Log in so `auth-user-id` matches a seeded `users.id`

```bash
# List comments
curl -s "http://127.0.0.1:3000/api/comments/paper/PAPER_UUID"

# Post comment
curl -s -X POST "http://127.0.0.1:3000/api/comments" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: USER_UUID" \
  -d '{"paperId":"PAPER_UUID","content":"Hello from API"}'
```
