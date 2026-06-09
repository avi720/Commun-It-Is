# Commun-It-Is — Architecture

> **Last updated:** 2026-06-09 (Batch 1 of the TECH-DEBT remediation pass).
> **Audience:** future-you on another machine + any new contributor.
> **Scope:** how the app is wired, why it's wired that way, and the conventions you should keep.

This document is *short on purpose*. It describes the live system, not an idealized one. When the system changes, this file changes — if the file is out of date, that's a bug to fix in the same PR.

---

## TL;DR

- **Frontend:** React 19 + Vite 7 + Tailwind 3 + shadcn-style UI primitives, deployed to Vercel as a static SPA. Wrapped with Capacitor 8 for the Android store build.
- **Backend:** A single FastAPI app served from one Vercel Serverless Function (`api/index.py` → `src/server/main.py`).
- **Data + Auth:** Supabase (Postgres + GoTrue). The app reaches Supabase **two different ways** — see *Two data paths* below.
- **Push:** Firebase Cloud Messaging via the Capacitor `@capacitor/push-notifications` plugin; the FCM token is stored on the user row and used by the backend's `firebase-admin` to push committee announcements.
- **State on the client:** React Query for data; `AppContext` for the cross-cutting `user` / `session` / `isAuthenticated` triplet only.

---

## Two data paths (the one thing to remember)

The single most surprising thing about this codebase is that the client reaches Supabase via **two different routes** depending on the resource. You need to know which is which before you touch a feature.

```
┌──────────────┐   ┌─────────────────────┐   ┌──────────┐
│ React client │──▶│ src/Api/*.js (avior)│──▶│ FastAPI  │──▶ Supabase
└──────────────┘   └─────────────────────┘   └──────────┘
        │                                                 │
        │           direct (supabase-js)                   │
        └─────────────────────────────────────────────────▶┘
                       (RLS is the only guard)
```

- **avior → FastAPI path** carries an auth header (`Authorization: Bearer <access_token>`); the FastAPI dependency `get_current_user_id` (and `get_committee_community_id`) re-verifies the token and runs the query as a trusted server. Used by: posts, rides, notification-send, FCM-token update, business approval.
- **supabase-js direct path** uses the user's anon JWT directly; the only thing standing between a curious client and somebody else's data is **Row-Level Security**. Used by: phonebook contacts, communities (list / join), notification *history*, all reads in `CommitteeDashboard`, and `users.createProfile` during onboarding.

| Resource | Path | Auth model |
|---|---|---|
| `posts` (CRUD) | avior → FastAPI | Token verified; community derived from token. |
| `rides` (CRUD) | avior → FastAPI | Token verified; 10-minute grace window applied in Python. |
| Notification send (committee → community) | avior → FastAPI | Token verified; `get_committee_community_id` enforces committee role and community match. |
| FCM token update | avior → FastAPI | Token verified. |
| `users.delete` (self) | avior → FastAPI | Token verified; `current_user_id == user_id` enforced. |
| `users.update` (self) | avior → FastAPI | Token verified; self-update only. |
| `users.createProfile` (onboarding) | supabase-js direct | RLS required. |
| `phonebook` reads | supabase-js direct | RLS required. |
| `communities.getAll` / `joinByName` | supabase-js direct | RLS required. |
| `important_notifications` history reads | supabase-js direct | RLS required. |
| `CommitteeDashboard` reads (`businesses`, `users`, `communities`) | supabase-js direct | RLS required. |
| `CommitteeDashboard` business approval | supabase-js direct | RLS required. |

The RLS column with "required" is the open question — see `docs/RLS-AUDIT.md` (produced by Batch 3 of the TECH-DEBT pass).

**Rule of thumb for new features:**
- If the operation needs role enforcement or any logic that should not be in client code → avior → FastAPI.
- If the operation is a plain read of public-within-community data → supabase-js direct, **after** verifying an RLS policy exists for it.
- If you can't decide, default to FastAPI. It's the cheaper mistake.

---

## Client architecture

### Routing

`src/App.jsx` owns the router. Routes are lazy-loaded with `React.lazy`. Three guard components live in this file:

- `ProtectedRoute` — requires `isAuthenticated`. Sends to `/login` otherwise, to `/onboarding` if the profile is incomplete, to `/resident-verification` if the resident verification is pending.
- `OnboardingRoute` — requires `isAuthenticated` *and* `user.isIncomplete`. Anything else redirects to `/`.
- `CommitteeRoute` (`src/Components/routes/CommitteeRoute.jsx`) — requires `user.community_role === 'committee'`. Reads the role from the `AppContext` snapshot (see *Known caveats* below).

All authenticated routes render inside `MainLayout`, which owns the header, the sidebar overlay, and the `<Outlet />` for page content.

### State

| State | Lives in | Why |
|---|---|---|
| `user`, `session`, `isAuthenticated`, `isLoading` | `AppContext` | Cross-cutting; used by guards and every page. |
| `isSidebarOpen` / `closeSidebar` | `MainLayout` local state, passed via `Outlet` context | Only `Sidebar` and `HomePage`'s FAB consume it. Hoisting to `AppContext` would re-render every page on toggle. |
| Server data (posts, rides, residents, businesses…) | React Query cache | See *Cache-key convention* below. |
| Form local state | `useState` inside the form | Standard React. |

### Cache-key convention (React Query)

The codebase is in the middle of migrating off hand-rolled `useState + useEffect` data fetching. Use these key shapes when adding `useQuery` to a new page:

| Resource | Key | Notes |
|---|---|---|
| Posts feed | `['posts', communityId]` | Invalidate on `Post.create`. |
| Rides board | `['rides', communityId]` | Already in use in `PublicDisplay`; refetch interval 5s. |
| Phonebook | `['phonebook', communityId]` | Static-ish; stale time 60s is fine. |
| Notifications history | `['notifications', communityId]` | Invalidate after committee broadcast. |
| Committee — businesses tab | `['businesses', communityId]` | Invalidate after approve/reject mutation. |
| Committee — residents tab | `['residents', communityId]` | Invalidate after verify/role-change mutation. |
| Committee — community settings | `['community', communityId]` | Invalidate after settings save. |
| Current user role (route guards) | `['me', userId]` | `staleTime: 0` so guards re-read on every navigation. |

Defaults are configured once in `src/main.jsx`: `staleTime: 30_000`, `refetchOnWindowFocus: false`. Override per-query when something needs different semantics (e.g. the rides board's 5-second refetch interval).

---

## Backend architecture

`src/server/main.py` wires three routers (`posts`, `rides`, `users`, `notifications`) and a CORS middleware that reads `ALLOWED_ORIGINS` from env (comma-separated). `src/server/auth.py` provides the dependency-injected auth primitives used by every protected endpoint:

- `get_current_user_id` — verifies the bearer token via Supabase Auth and returns the user id.
- `get_user_community_id` — also returns the user's community.
- `get_committee_community_id` — additionally enforces `community_role === 'committee'`. The community is **always** derived from the verified token, never trusted from the request body.

The backend is deployed as a single Vercel Serverless Function via `api/index.py` and `vercel.json`. Dependencies are pinned in the **root** `requirements.txt`; the `src/server/requirements.txt` that existed historically has been removed (see TECH-DEBT T17).

---

## Push notifications

1. Capacitor's `@capacitor/push-notifications` plugin fires `registration` on the device; the listener writes the FCM token to `localStorage`.
2. `AppContext.loadUserData` reads the stored token after login and sends it to the backend (`avior.notifications.updateToken`).
3. Committee broadcasts go through `avior.notifications.sendToCommunity` → FastAPI → `firebase-admin` → FCM.
4. History is read back via supabase-js direct from `important_notifications`.

The Web build does **not** initialise FCM (Capacitor's `isNativePlatform()` gate); push exists only in the Android wrapper.

---

## Environment variables

Loaded by Vite (`VITE_*` prefix → client bundle) or by `os.getenv` in Python. The canonical list lives in `.env.example` at the repo root — keep that file in sync with the code.

| Var | Used by | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | client + server | Same URL on both sides. |
| `VITE_SUPABASE_KEY` | client | Anon key (will become `VITE_SUPABASE_ANON_KEY` — see T23 deferral in TECH-DEBT.md). |
| `VITE_SUPABASE_SERVICE_KEY` | server | Service role key. Despite the `VITE_` prefix, this is **only** read server-side; nothing in `src/` reads it. The `VITE_` prefix is a footgun left over from history — to be renamed under T23 in a future batch. |
| `VITE_GOOGLE_MAPS_API_KEY` | client | Used by `CitySelect`. |
| `VITE_API_URL` | client | Backend URL. Optional — defaults to same origin. |
| `FIREBASE_CREDENTIALS` | server | JSON service-account credentials. |
| `ALLOWED_ORIGINS` | server | Comma-separated list of origins for CORS. Production: the Vercel URL. Dev default: `http://localhost:5173`. |

---

## Known caveats (the things future-you will trip on)

1. ~~**Stale `community_role`** — `CommitteeRoute` reads the role from the `AppContext` snapshot loaded once at sign-in.~~ **Resolved in Batch 2.** `CommitteeRoute` now runs a React Query (`['me', userId]`, `staleTime: 0`) on every navigation and redirects home if the role isn't `committee`. The FastAPI side still re-checks live as a server-side defence-in-depth.
2. **Onboarding writes go direct** — `users.createProfile` bypasses FastAPI. If the corresponding RLS policy is missing or wrong, the entire onboarding flow either silently succeeds (no policy → admin-bypass via service role from somewhere else) or silently fails. Audit lives in `docs/RLS-AUDIT.md` (Batch 3).
3. **`alert()` is everywhere** — the app uses native `alert()` / `confirm()` for in-app feedback in many places. Batch 2 of the TECH-DEBT pass migrates these to `sonner` toasts and a shadcn-style `AlertDialog`.
4. **ARM64 Windows dev machine** — npm packages that ship x64-only `.node` binaries fail to load. Prefer pure-JS or WASM alternatives. (This is why we use Supabase JS instead of Prisma, and `sonner` instead of any toast library with native deps.)
5. **No CI gate** — `main` auto-deploys to Vercel. Vercel runs `npm run build` before deploy, so a build failure blocks the deploy, but `npm run lint` is local-only. Tracked as TECH-DEBT T5; on hold until an ESLint config exists.

---

## Where the trackers live

- `docs/TECH-DEBT.md` — backend / architecture / dependency / test debt. Each finding has an `[ ]` / `[x]` checkbox; the in-progress batch is whatever has empty boxes near the top.
- `docs/UI-AUDIT.md` — UI / UX findings. Same checkbox convention.
- `docs/RLS-AUDIT.md` — produced by Batch 3 of the TECH-DEBT pass; per-table RLS policy gap analysis.

When you're about to make a non-trivial change, scan these files first. There may already be a tracked finding that overlaps with what you're doing — closing two in one diff is cheaper than discovering the overlap after the fact.
