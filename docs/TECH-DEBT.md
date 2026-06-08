# Commun-It-Is — Tech Debt Audit & Remediation Plan

> **Audit date:** 2026-06-08
> **Auditor:** Claude (engineering:tech-debt skill)
> **App version reviewed:** main branch at commit `b9010c4` + production at https://commun-it-is.vercel.app/

---

## Background

A Hebrew (RTL) community app delivered as a React PWA and wrapped with Capacitor for the Android store. Frontend is React + Vite, deployed on Vercel; backend is a FastAPI app served from a single Vercel Serverless Function (`api/index.py` → `src/server/main.py`); data and auth live in Supabase; push lives in Firebase Cloud Messaging.

**Scope:** Backend security, code health, architecture, tests, dependencies, documentation, and infrastructure. **UI/UX is out of scope** — that is covered in [`docs/UI-AUDIT.md`](UI-AUDIT.md). Where a tech-debt finding overlaps with a UI finding, the overlap is noted explicitly.

**Stack reviewed:** React 19 · Vite 7 · Tailwind 3 · shadcn-style UI primitives · TanStack Query 5 · Supabase JS · Capacitor 8 · FastAPI · python-supabase · firebase-admin · Vercel (frontend + serverless backend).

**Methodology:**
1. Full source read of `src/`, `api/`, and `src/server/` (routes, auth dependencies, schemas, config).
2. Cross-reference between client API layer (`src/Api/*`) and server routes (`src/server/routes/*`) to find auth-gap and inconsistent data-path issues.
3. Static pattern sweep across `src/` for `alert(`, `console.log`, `TODO`, `useQuery`, `supabase.from`, missing imports, and JSX hazards.
4. Manifest review: `package.json`, both `requirements.txt` files, `vercel.json`, `.gitignore`, `README.md`.
5. Cross-check with existing artefacts: `docs/UI-AUDIT.md` (to avoid duplication) and the most recent commits on `main`.
6. Each item scored with `Priority = (Impact + Risk) × (6 − Effort)`, all on a 1-5 scale.

**Reference frameworks:** OWASP Top 10 (Broken Access Control, Security Misconfiguration) · 12-Factor App (Config, Dependencies, Logs) · TanStack Query data-flow conventions · FastAPI dependency-injection security model · Supabase Row Level Security.

---

## How to Use This Plan

- Each finding is **outcome-driven**: it states what is wrong and what "fixed" looks like, but **not** how to implement it. The implementer chooses the approach.
- Work top-down by phase. **Do not skip Phase 1** — Phase 1 contains active security holes and a runtime-broken page.
- Tick the box only when the **Acceptance** clause is satisfied — not when the change is merely written.
- If a finding turns out to be invalid in context, leave the box unchecked and add a `~~strikethrough~~` note explaining why.
- New findings discovered during fixes go at the bottom under "Discovered During Remediation".
- When a finding overlaps with [`docs/UI-AUDIT.md`](UI-AUDIT.md), the cross-reference is in the Issue line. Fix once; tick the box in both files.

---

## Strengths — What Already Works Well

Preserve these patterns when refactoring:

- FastAPI dependency-injection auth model (`get_current_user_id`, `get_user_community_id`, `get_committee_community_id`) is clean — community is always derived from the verified token, never trusted from the request body.
- Server-side committee enforcement for posts (`src/server/routes/posts.py:75`) correctly mirrors the client UI guard, so a forged request from a non-committee user is rejected.
- Server-side committee enforcement for notification-send (`src/server/routes/notifications.py:14`) ignores the body `community_id` and uses the token-derived one — a committee member cannot notify another community.
- `getAuthHeadersMultipart` correctly omits `Content-Type` so the browser sets the multipart boundary itself.
- Modular `src/Api/` split (auth, rides, users, posts, communities, phonebook, notifications) keeps each client API surface small and grep-able.
- Lazy route loading via `React.lazy` in `App.jsx` keeps the initial bundle small.
- React Query is used pragmatically where it lands: rides board uses `useQuery` with a 5-second refetch and `keepPreviousData`-style cache key; send-ride form uses `useMutation`.
- Path aliases (`@/...`) are wired through `jsconfig.json` and used consistently in the components that adopt them.

---

## Findings

ID convention: `T##` numbered globally across phases. Where a finding was confirmed by reading the deployed response or running the code path, the `Issue` line says **"Confirmed."**

---

### Phase 1 — Critical (security holes and broken pages; must clear before next release)

#### [x] T1. `GET /api/users` returns every user's full profile with no auth
- **Where:** `src/server/routes/users.py:13-19`
- **Issue:** **Confirmed.** Endpoint has no auth dependency. Anyone hitting `https://commun-it-is.vercel.app/api/users` receives every user's `id`, `firstName`, `lastName`, `phone`, `address`, `age`, `community_role`, `community_id`, and `fcm_token`. PII leak plus committee enumeration. The endpoint is not consumed by any client code in `src/Api/`.
- **Acceptance:** Endpoint either requires `Depends(get_committee_community_id)` and filters by that community, or is removed entirely. Verified by hitting the production URL anonymously and getting `401` (or `404` if removed).

#### [x] T2. `DELETE /api/users/{user_id}` has no auth dependency
- **Where:** `src/server/routes/users.py:22-42`
- **Issue:** **Confirmed.** No `Depends(get_current_user_id)`. Any anonymous request can permanently delete any user by id. The neighbouring `PUT /api/users/{user_id}` at line 49 uses the correct pattern — this one was missed during the refactor.
- **Acceptance:** Endpoint enforces `current_user_id == user_id` (self-delete only) or restricts to committee members. Verified by anonymous `curl -X DELETE` returning `401`, and by a non-owner authenticated `curl -X DELETE` returning `403`.

#### [x] T3. `PhoneBook` page is broken at runtime — `avior` used but not imported
- **Where:** `src/Pages/PhoneBook.jsx:19` calls `avior.phonebook.getContacts(...)`; the `import` block at lines 1-3 does not include `avior`.
- **Issue:** **Confirmed.** `ReferenceError: avior is not defined` is swallowed by the `try / catch` at line 22, so users see an empty contact list with no error toast. This page has been broken on every release since the modular `src/Api/` split.
- **Acceptance:** `import { avior } from '../Api/Client';` (or `from '../Api'` once T14 is done) added. Verified by loading PhoneBook in a real authenticated session and seeing contacts render.

#### [x] T4. CORS `allow_origins=["*"]` combined with `allow_credentials=True`
- **Where:** `src/server/main.py:14-22`
- **Issue:** Browsers ignore credentialed requests against wildcard origin, so the misconfiguration *appears* harmless — but it explicitly invites any third-party site to perform anonymous fetches against the API. Combined with T1 and T2, that is a one-click data-harvester for any attacker who learns the URL.
- **Acceptance:** `origins` is read from an env var (production: the Vercel URL only; dev: `http://localhost:5173` only). Verified by sending a request with `Origin: https://evil.example.com` and seeing the response missing the `Access-Control-Allow-Origin` header.

#### [ ] T5. No CI gate on `main` — Vercel auto-deploys unchecked code
- **Where:** No `.github/workflows/` directory exists.
- **Issue:** **Deferred 2026-06-08** — a build-only CI workflow duplicates the `npm run build` that Vercel already runs before every deploy, so this finding is on hold pending an ESLint configuration in the repo. Re-evaluate once a flat `eslint.config.js` exists and `npm run lint` exits 0; at that point CI starts catching things `vite build` does not (the JSX-comment hazard at `src/App.jsx:102`, undefined-symbol bugs like the historic `avior` reference in T3, etc.). Original issue: push to `main` triggers a Vercel deploy with zero pre-flight checks. Lint, type-check, and build all currently rely on the developer remembering to run them locally.
- **Acceptance:** `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, and `npm run build` on every push and PR. Branch protection on `main` requires the workflow to pass. Verified by intentionally breaking a file and seeing the workflow fail.

#### [x] T6. `docs/UI-AUDIT.md` is untracked in git
- **Where:** `docs/UI-AUDIT.md` (only on the working tree per `git status` at session start).
- **Issue:** A 100+ finding remediation plan lives one `rm` away from gone. It is not visible to future sessions, future-self on another machine, or any collaborator.
- **Acceptance:** Both `docs/UI-AUDIT.md` and `docs/TECH-DEBT.md` (this file) are committed to `main`.

---

### Phase 2 — Important (architectural cleanup & correctness)

#### [ ] T7. Two parallel data paths with different auth surfaces
- **Where:** Rides, posts, notification-send, fcm-token update go through `client → avior (fetch) → FastAPI → Supabase`. Communities (`getAll`, `joinByName`), phonebook contacts, notification *history*, all data fetches in `CommitteeDashboard`, and `users.js:createProfile` go through `client → supabase-js → Supabase` directly.
- **Issue:** Two auth surfaces. FastAPI side enforces role checks in Python. Client-direct side relies on Supabase **Row Level Security** policies that are not documented in this repo. If RLS is weak or missing for any table touched by the direct path (`businesses`, `users`, `communities`, `important_notifications`), a curious committee member can read or mutate other communities' data and the codebase would never reveal it.
- **Acceptance:** A documented RLS policy exists for every table accessed directly from the client. Or all writes are routed through FastAPI and direct client access is limited to read-only views. Decision recorded in `docs/ARCHITECTURE.md` (see T22).

#### [ ] T8. React Query is installed but adopted in only 2 of ~6 data-fetching pages
- **Where:** `Pages/PublicDisplay.jsx:24` and `Pages/SendRide.jsx:27` use `useQuery` / `useMutation`. `HomePage.jsx`, `PhoneBook.jsx`, `NotificationsHistory.jsx`, `CommitteeDashboard.jsx` hand-roll `useState + useEffect + try / catch + setLoading(false)`.
- **Issue:** Half-adopted pattern. Pages that should be cached aren't, the same network round-trip happens on every mount, and there is no consistent error/retry semantics. Onboarding effort for a new component is also higher because there are two patterns to choose from.
- **Acceptance:** Every data-fetching page uses React Query. Manual `setLoading` state machines are removed. Cache-key conventions are documented in `docs/ARCHITECTURE.md` (e.g., committee approving a resident invalidates `["residents", communityId]`).

#### [ ] T9. Native `alert()` used for in-app feedback (18 occurrences)
- **Where:** `HomePage`, `SendRide`, `OnboardingPage`, `SettingsPage`, `PhoneBook`, `FeedPosts`, `usePushNotifications`, `CommitteeDashboard`, `ProfileForm`, `CreatePostModal`, `location.jsx`, `VerificationEmailSent`, `Api/users.js`.
- **Issue:** Overlaps with [`docs/UI-AUDIT.md`](UI-AUDIT.md) F16. Tech-debt angle: every screen invents its own error pattern because there is no shared error UI to consolidate around. Also blocks observability — there is no central place to forward these to a tracker.
- **Acceptance:** Single toast provider mounted at the app root (`sonner` or equivalent pure-JS library — no native deps, per the ARM64 constraint). All 18 `alert()` / `confirm()` call sites replaced with `toast.error(...)` / `toast.success(...)` / a proper confirmation-dialog primitive for destructive actions. Same primitives used everywhere.

#### [x] T10. 40 `console.log/error/warn` calls in production code, one leaks the session token
- **Where:** 20 files. The most serious instance is `src/context/AppContext.jsx:34` — `console.log("Session found:", currentSession)` prints the full Supabase `access_token` and `refresh_token` to the browser console on every page load.
- **Issue:** Information leak in the worst case (browser extensions, shoulder-surfing, screencasts that capture devtools). Noise in the general case — real errors are harder to spot. No central place to forward errors to a tracker (see T19).
- **Acceptance:** All `console.log` removed or guarded by `if (import.meta.env.DEV)`. `console.error` retained only where it adds debugging information beyond what the user sees in the toast UI (T9). Verified — no token-shaped string appears in the production console across the full set of routes.

#### [ ] T11. Client-side committee route guard reads from a potentially stale profile
- **Where:** `src/Components/routes/CommitteeRoute.jsx:14` — `if (user?.community_role !== 'committee') { ... }`.
- **Issue:** `community_role` is read from the `users` table snapshot loaded once at sign-in (`AppContext.loadUserData`). If a committee member is demoted, they keep their committee UI access until they sign out and back in. The FastAPI side (`get_committee_community_id`) re-checks live, but the direct-supabase paths (T7) trust the stale role.
- **Acceptance:** Either the role is verified via a Supabase RLS policy on the relevant tables (so a stale role cannot read/write), or the client refetches the role on every committee-route navigation. Verified by manually demoting a user in Supabase and confirming they lose access within one navigation, without sign-out.

#### [ ] T12. JSX-mode comment syntax inside `<Routes>`
- **Where:** `src/App.jsx:102` — `// כל נתיב אחר זורק ללוגין` sits between two `<Route>` siblings inside `<Routes>`.
- **Issue:** JSX treats text between elements as a text child. `<Routes>` only accepts `<Route>` children — the line is either silently swallowed by react-router or rendered as a stray text node, depending on react-router version. A `react/jsx-no-comment-textnodes` lint rule would have caught it.
- **Acceptance:** Comment replaced with `{/* ... */}` or removed. `npm run lint` passes with `react/jsx-no-comment-textnodes` enabled in the ESLint config.

#### [ ] T13. Duplicate page-loader markup
- **Where:** `src/App.jsx:28-32` (the `PageLoader` component) and `src/App.jsx:73-76` (an inline copy in `AppRoutes`).
- **Issue:** Same JSX appears twice. If the brand colour or copy changes, only one of them gets updated.
- **Acceptance:** Single `PageLoader` component used in both call sites.

#### [x] T14. `src/Api/Client.js` is a 3-line backward-compat shim
- **Where:** `src/Api/Client.js` simply re-exports `supabase, avior` from `./index`.
- **Issue:** Dead indirection. Every consumer either imports from `Client.js` or from `index.js` — there are two import paths for the same symbols, no behavioural difference.
- **Acceptance:** All imports updated to `from '../Api'` (or `@/Api`). `Client.js` deleted. Build and lint pass.

#### [ ] T15. Sidebar open/close state lives in global `AppContext`
- **Where:** `src/context/AppContext.jsx:12-16` — `isSidebarOpen`, `toggleSidebar`, `closeSidebar`.
- **Issue:** This state is consumed only by `MainLayout` and `Sidebar`. Hoisting it to global context forces every consumer of `useAppData` to re-render on sidebar toggle, including unrelated pages.
- **Acceptance:** State moves to local component state in `MainLayout`, passed to `Sidebar` via props or via a small `useSidebar` hook scoped to the layout. `AppContext` no longer exposes sidebar APIs.

#### [ ] T16. `CommitteeDashboard.jsx` is a 397-line god component
- **Where:** `src/Pages/CommitteeDashboard.jsx`
- **Issue:** Mixes three tabs (businesses, residents, settings), a notification-send modal, three direct Supabase fetches, and tab-switching UI in one file. Adding a fourth tab — e.g., reports — would make it unmanageable. Also makes T8 (React Query migration) harder because there are three fetches to convert at once.
- **Acceptance:** Split into `BusinessesTab.jsx`, `ResidentsTab.jsx`, `CommunitySettingsTab.jsx`, plus a `SendCommitteeMessageModal.jsx`. Each tab owns its data fetch via React Query (combines with T8). Top-level `CommitteeDashboard.jsx` under 100 lines and contains only the tab shell.

#### [x] T17. Duplicate `requirements.txt`, one of them UTF-16 encoded
- **Where:** Root `/requirements.txt` (5 packages, no version pins) and `src/server/requirements.txt` (~75 packages, UTF-16 LE with BOM and spaces between every letter — clearly produced by `pip freeze > file.txt` from default-encoding PowerShell).
- **Issue:** Two sources of truth for backend dependencies. Vercel resolves one of them (root, by convention). The other is dead noise that looks authoritative because it has version pins. The encoding is broken — `cat` shows characters with leading spaces.
- **Acceptance:** `src/server/requirements.txt` deleted. Root `requirements.txt` pinned to known-good versions (e.g., `fastapi==0.124.0`, `supabase==2.27.1`, `firebase-admin==7.1.0`, `python-dotenv==1.2.1`, `python-multipart==0.0.21`). Verified — `vercel build` succeeds with the pinned versions.

#### [x] T18. `.env.example` referenced in README but presence unverified
- **Where:** `README.md:26` — "העתק את `.env.example` ל-`.env`".
- **Issue:** No `.env.example` is visible in the repo root listing. If it does not exist, every new contributor (and every fresh Vercel project import) has to guess env-var names by grepping the codebase.
- **Acceptance:** `.env.example` exists in the repo root, committed to git, and lists every env var the app uses (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_SUPABASE_SERVICE_KEY`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_API_URL`, `FIREBASE_CREDENTIALS`) with placeholder values and a one-line comment per var.

#### [ ] T19. No error tracking for frontend or backend
- **Where:** App-wide. `src/main.jsx` does not initialise a tracker; `src/server/main.py` does not initialise a tracker.
- **Issue:** Vercel runtime logs catch backend exceptions only. Frontend errors (the silent `avior` `ReferenceError` in T3, future broken pages) leave no signal until a user reports them. As the codebase grows, signal-blindness becomes the limiting factor on iteration speed.
- **Acceptance:** Pure-JS frontend error tracker (Sentry, Highlight, or equivalent — no native deps per the global ARM64 constraint) initialised in `src/main.jsx`. Backend tracker initialised at the top of `src/server/main.py`. One intentional error per side proves alerts reach the dashboard.

---

### Phase 3 — Polish (test, dependency, documentation hygiene)

#### [ ] T20. Zero automated tests for either layer
- **Where:** App-wide. No `vitest.config.*`, no `jest.config.*`, no `pytest.ini`, no `tests/` directory.
- **Issue:** No safety net for committee-role enforcement, no regression coverage for the ride-expiration time math at `src/server/routes/rides.py:33-49`, no contract test that the auth dependencies block unauthenticated callers.
- **Acceptance:** Three minimal test suites added (do not chase coverage targets — chase risk):
  1. `pytest` for `src/server/auth.py` — verifies `get_committee_community_id` raises 403 for non-committee users, raises 400 when community is missing, and returns the community on success.
  2. `pytest` for `src/server/routes/rides.py` — the 10-minute grace window math. Edge cases: ride 9m59s past departure (kept), ride 10m01s past (excluded), DST boundary.
  3. `vitest` for `src/App.jsx` route guards — `ProtectedRoute`, `OnboardingRoute`, `CommitteeRoute` redirect correctly for each user state.
  The CI from T5 runs these on every PR.

#### [ ] T21. No `npm audit` automation
- **Where:** No CI step exists.
- **Issue:** Supply-chain vulnerabilities in transitive deps surface only when the developer remembers to run `npm audit` locally.
- **Acceptance:** A non-blocking `npm audit --audit-level=high` step in the CI workflow from T5, with results visible on each PR. Verified — a known-vulnerable dep produces a PR comment or a failing check.

#### [ ] T22. No architecture documentation for the two data paths
- **Where:** No `docs/ARCHITECTURE.md`.
- **Issue:** The fork between `avior → FastAPI` and `supabase-js direct` (see T7) is invisible from the repo. A new contributor — or future-you in six months — will pick whichever pattern they happen to see first, and the inconsistency will deepen.
- **Acceptance:** `docs/ARCHITECTURE.md` exists. It contains: a one-paragraph data-flow diagram (ASCII is fine), a table mapping each table → which path is the source of truth → which auth model protects it, and the rationale for the chosen path. React Query cache-key conventions from T8 live here too.

#### [ ] T23. README env-var naming inconsistencies
- **Where:** `README.md` lists `VITE_SUPABASE_KEY` while Supabase tooling and most community docs use `VITE_SUPABASE_ANON_KEY`. Backend uses `VITE_SUPABASE_SERVICE_KEY` — a `VITE_`-prefixed name for a server-only secret, which is unusual and surprising.
- **Issue:** Onboarding friction. The `VITE_` prefix on a server secret is also a footgun — a future change that reads it from `import.meta.env` instead of `os.getenv` would expose the service key in the client bundle.
- **Acceptance:** Backend env var renamed to `SUPABASE_SERVICE_KEY` (no `VITE_` prefix); `src/server/config.py` updated. Optional: rename `VITE_SUPABASE_KEY` to `VITE_SUPABASE_ANON_KEY` to match Supabase docs. README + `.env.example` (T18) updated accordingly.

---

## Open Questions / Items Requiring Owner Input

These were noted during the audit but need product or security decisions before they become actionable findings:

- **Supabase RLS status** — without seeing the live RLS policies, T7 and T11 cannot be fully scoped. Decision needed: enforce via RLS, via FastAPI, or both?
- **Backend retention** — React Query + supabase-js could plausibly replace FastAPI entirely (committee guards via RLS, file uploads via Supabase Storage from the client). Is the Python backend worth keeping? Killing it removes a deploy target and a language; keeping it preserves room for server-side image processing, scheduled jobs, and trusted business logic.
- **Local dev backend** — `run_local_backend.py` and the global note about ARM64 Firebase issues suggest backend dev is awkward on the dev machine. Is the local dev story "frontend only, point at production API", or should the backend run locally too?
- **Capacitor** — the Android wrapper is configured and the README treats it as a future-store-publish artefact. Is it still planned? If not, removing `@capacitor/*` deps shrinks `node_modules` materially.
- **Logging policy** — once T19 lands, decide what to send to the error tracker (errors only? warnings? performance events?) and what to retain in plain `console.error` for local debugging.

---

## Discovered During Remediation

> Add new findings here as they surface while working through the plan. Same format: `[ ] T##. Title` + Where / Issue / Acceptance.
