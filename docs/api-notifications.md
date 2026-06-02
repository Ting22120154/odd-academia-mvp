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

**Success `200`:**

```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "text": "New comment on your paper: …",
      "type": "Comment",
      "date": "2025-01-29",
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
