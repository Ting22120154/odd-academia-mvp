# Frontend auth, profile & follow (branch: `feat/auth-user-follow-api`)

Quick map for reviewers. All routes return `{ success, data? }` or `{ success: false, error }`.

## Auth (`/api/auth/*`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/register` | — | bcrypt; `role: user` only; min 8 char password; rate limited |
| POST | `/api/auth/login` | — | Generic error if credentials wrong; rate limited |
| POST | `/api/auth/logout` | — | Clears httpOnly cookies |
| GET | `/api/auth/me` | JWT | `PublicUser` for nav / AuthContext |

**Cookies:** `oa_user_token` (JWT, httpOnly, `secure` in production), `auth-session=user`.

**Required env:** `JWT_SECRET` (no fallback — app throws if missing).

## Profile (`/api/users/*`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/users/me` | JWT | Full profile + email + papers |
| PATCH | `/api/users/me` | JWT | User fields + interests in `$transaction` |
| GET | `/api/users/[id]` | optional | Valid UUID; private → 403; `isFollowing` if logged in |

## Follow

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/users/[id]/follow` | JWT | Cannot follow self |
| DELETE | `/api/users/[id]/follow` | JWT | |
| GET | `/api/users/[id]/follow-status` | optional | |
| GET | `/api/users/me/following` | JWT | |
| GET | `/api/users/me/followers` | JWT | |

## Page guards (`src/proxy.ts`)

Uses `verifyToken()` (signature checked). Redirects anonymous users from `/profile`, `/following`, `/upload`, etc.

API routes each call `getAuthPayload()` — not protected by proxy.

## AuthContext compatibility

- `applySession(user)` — preferred after login/register
- `login(user)` — deprecated alias of `applySession`
- `logout()` — async; clears cookies via API

## Key files

- `src/lib/auth/*` — jwt, session, password, rate-limit, user-id, profile, follow
- `src/context/AuthContext.tsx`
- `src/proxy.ts`

**Env (not in git):** `DATABASE_URL`, `JWT_SECRET` in `frontend/.env.local`.
