# Notifications API

Owner: **Hadi (Person 3 — Phase 2)**  
Auth: cookie `auth-user-id` or header `X-User-Id`.

**Schema:** `notifications` — no message column; `text` and `href` are built in the service from `type` + references.

**Created automatically when:**
- Someone comments on your paper → `type: comment`
- Someone replies to your comment → `type: reply`

---

## GET `/api/notifications`

List notifications for the current user.

**Query params:**

| Param | Values | Default |
|-------|--------|---------|
| `tab` | `new`, `all`, `papers`, `comments`, `contact`, `citations` | `all` |
| `sort` | `date`, `type` | `date` |
| `dir` | `asc`, `desc` | `desc` |
| `oldLimit` | positive int (New tab only) | `5` |

**Success `200`:**

On `tab=new`, the response splits unread vs read:

- `newNotifications` — all unread (grouped), no limit
- `oldNotifications` — read (grouped), up to `oldLimit` items
- `oldTotal` — total read groups (for “Load more”)
- `unreadCount` — unread row count

Other tabs return `notifications` only (grouped). Each item includes `ids[]` (row ids in the group) and `groupCount`.

**Success `200` (all tabs):**

```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "text": "New comment on your paper: …",
      "type": "Comment",
      "date": "29/01/2025",
      "isRead": false,
      "href": "/paper/1#comment-uuid",
      "createdAt": "ISO-8601"
    }
  ],
  "unreadCount": 2
}
```

---

## PATCH `/api/notifications/:id/read`

Mark one notification as read.

**Success `200`:** `{ "success": true, "read": true }`

---

## PATCH `/api/notifications/read-all`

Mark all notifications as read for the current user.

**Success `200`:** `{ "success": true, "readAll": true }`

---

## Local testing

1. Log in as `rick.smith@example.com`
2. Log in as another seeded user in another browser (or use `X-User-Id` for comment POST)
3. Post a comment on Rick’s paper → Rick sees notification on `/notifications`
4. `curl -s "http://127.0.0.1:3000/api/notifications?tab=new" -H "X-User-Id: RICK_UUID"`
