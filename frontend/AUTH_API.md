# Frontend auth, profile & follow (branch: `feat/auth-user-follow-api`)

Quick map for reviewers. All routes return `{ success, data? }` or `{ success: false, error }`.

## Auth (`/api/auth/*`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/register` | — | bcrypt password; `role: user` only; sets httpOnly JWT cookies |
| POST | `/api/auth/login` | — | Generic error message if credentials wrong |
| POST | `/api/auth/logout` | — | Clears cookies |
| GET | `/api/auth/me` | JWT | Minimal `PublicUser` for nav / AuthContext |

**Cookies:** `oa_user_token` (JWT), `auth-session=user` (proxy guard). Guest uses `auth-session=guest`.

## Profile (`/api/users/*`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/users/me` | JWT | Full profile + email + papers |
| PATCH | `/api/users/me` | JWT | Updates user row + interest tags |
| GET | `/api/users/[id]` | optional | UUID only; private profiles → 403; `isFollowing` if logged in |

## Follow

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/users/[id]/follow` | JWT | Cannot follow self |
| DELETE | `/api/users/[id]/follow` | JWT | |
| GET | `/api/users/[id]/follow-status` | optional | |
| GET | `/api/users/me/following` | JWT | |
| GET | `/api/users/me/followers` | JWT | `isFollowing` = mutual follow back |

## Page guards (`src/proxy.ts`)

Redirects to `/login` when anonymous: `/profile`, `/profile/edit`, `/following`, `/upload`, `/notifications`.

API routes are **not** protected by proxy; each handler calls `getAuthPayload()`.

## Key files

- `src/lib/auth/*` — JWT, session cookies, password, profile/follow mappers
- `src/lib/profile-client.ts` / `src/lib/follow-client.ts` — browser fetch helpers
- `src/context/AuthContext.tsx` — client session state

**Env (not in git):** `DATABASE_URL`, `JWT_SECRET` in `frontend/.env.local`.
