# Saved papers API

Owner: **Hadi (Person 3 — Phase 2)**  
Auth: cookie `auth-user-id` or header `X-User-Id` (same as comments API).

All success responses: `{ "success": true, ... }`  
All errors: `{ "success": false, "error": "message" }`

**Schema:** `paper_saves` (`user_id`, `paper_id`, `created_at`) — composite primary key.

---

## POST `/api/papers/:id/save`

Save a paper for the current user (idempotent).

**Auth:** required

**Success `201`:**

```json
{
  "success": true,
  "paperId": "uuid",
  "saved": true
}
```

**Errors:** `400` invalid UUID · `401` · `404` paper not found · `500`

---

## DELETE `/api/papers/:id/save`

Remove a saved paper.

**Auth:** required

**Success `200`:**

```json
{
  "success": true,
  "paperId": "uuid",
  "saved": false
}
```

**Errors:** `400` · `401` · `404` not saved · `500`

---

## GET `/api/papers/:id/save`

Check if the current user saved this paper.

**Auth:** required

**Success `200`:**

```json
{
  "success": true,
  "paperId": "uuid",
  "saved": true
}
```

**Errors:** `400` · `401` · `404` paper not found · `500`

---

## GET `/api/saved-papers`

List saved papers for the current user (newest first). Removed papers are omitted.

**Auth:** required

**Success `200`:**

```json
{
  "success": true,
  "count": 2,
  "papers": [
    {
      "paperId": "uuid",
      "title": "string",
      "abstract": "string?",
      "author": { "id": "uuid", "fullName": "string", "avatarUrl": "string?" },
      "savedAt": "ISO-8601"
    }
  ]
}
```

**Errors:** `401` · `500`

---

## Code layout

| Layer | Path |
|-------|------|
| Routes | `frontend/src/app/api/papers/[id]/save/`, `frontend/src/app/api/saved-papers/` |
| Service | `frontend/src/modules/saved-papers/saved-paper.service.ts` |
| Validation | `frontend/src/modules/saved-papers/saved-paper.validation.ts` |
| Types | `frontend/src/modules/saved-papers/types.ts` |

---

## Local testing

```bash
# From repo root
pnpm db:generate
pnpm db:push

# Save (use seeded paper + user UUIDs)
curl -s -X POST "http://127.0.0.1:3000/api/papers/PAPER_UUID/save" \
  -H "X-User-Id: USER_UUID"

# Status
curl -s "http://127.0.0.1:3000/api/papers/PAPER_UUID/save" \
  -H "X-User-Id: USER_UUID"

# List
curl -s "http://127.0.0.1:3000/api/saved-papers" \
  -H "X-User-Id: USER_UUID"

# Unsave
curl -s -X DELETE "http://127.0.0.1:3000/api/papers/PAPER_UUID/save" \
  -H "X-User-Id: USER_UUID"
```
