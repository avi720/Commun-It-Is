# AGENTS.md — Commun-It-Is

Guidance for coding agents working in this repository. Claude Code reads it through the
one-line `CLAUDE.md` next to it (`@AGENTS.md`); every nested `AGENTS.md` needs the same
companion — add one whenever you add a nested `AGENTS.md`.

A Hebrew (RTL) community app: rides, posts, phonebook and committee notifications. React SPA on
Vercel, a FastAPI backend in one Vercel Serverless Function, Supabase for data and auth, Firebase
Cloud Messaging for push, and a Capacitor wrapper in `android/` for a future store build.
Its purpose: let communities run themselves more easily, make residents' lives easier (finding
rides, local businesses and more to come), and gather all community activity in one place. Weigh
new features against these goals.
The full picture lives in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — read it before touching
a feature; this file only holds what every task needs.

## Commands

| Task | Command |
|---|---|
| Frontend dev server | `npm run dev` → `http://localhost:5173` |
| Backend locally | `uvicorn src.server.main:app --reload --port 8000` (after `pip install -r requirements.txt`) |
| Lint / build / frontend tests | `npm run lint`, `npm run build`, `npm test` (Vitest) |
| Backend tests | `pytest tests/server -v` (deps in `requirements-dev.txt`) |
| Database tests | `supabase start`, then `supabase db reset`, then `supabase test db --local` |
| Single frontend test | `npx vitest run src/Components/routes/routes.test.jsx` (`-t "<name>"` to filter) |
| Single backend test | `pytest tests/server/test_rides.py::<test_name> -v` |

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs lint, build, vitest, pytest, and
the pgTAP suite on Node 22 and Python 3.13, plus `npm audit --audit-level=high` (non-blocking). The
database job uses a local Supabase stack only — do not `supabase link` or `db push` from CI or from
an agent. Run the same set before pushing; CI does not block the Vercel deploy, which happens on
every push to `main`.

Local gotchas:

- **`npm run dev` talks to the production backend.** `vite.config.js` proxies `/api` to
  `https://commun-it-is.vercel.app`. To hit a local backend, set `VITE_API_URL` (e.g.
  `http://localhost:8000/api`) or change the proxy target — and remember writes go to the real
  Supabase project either way.
- **`firebase-admin` (grpcio) has no Windows ARM64 wheels**, so the full app may not import on
  the dev machine. `python run_local_backend.py` starts a dev-only app with just the
  users/rides/posts routers (no notifications); production always uses `src/server/main.py`.
- **`src/server/config.py` raises at import** if `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_KEY` or
  `FIREBASE_CREDENTIALS` are missing. Backend tests need dummy values for these (see the CI
  workflow); the `mock_supabase` fixture in `tests/server/conftest.py` replaces the real client.
- Frontend tests live next to the code as `src/**/*.test.{js,jsx}` (jsdom, globals on). `@` is
  aliased to `src/` in both Vite and Vitest.

## Layout

- `src/Pages`, `src/Components` — React UI (Tailwind, shadcn-style primitives). State: React Query
  for data, `AppContext` only for `user` / `session` / `isAuthenticated`.
- `src/Api/*.js` — client wrappers, exposed as the `avior` object from `src/Api/index.js`. They
  call FastAPI at `API_URL` (`VITE_API_URL` or `/api`) with the user's bearer token; the same
  module also re-exports the supabase-js client for the direct path.
- `src/server/` — FastAPI app (`main.py`, `routes/`, `auth.py`); `api/index.py` is the Vercel entry.
  Protected endpoints depend on `get_current_user_id` / `get_user_community_id` /
  `get_committee_community_id` from `auth.py`; the community always comes from the verified token,
  never from the request body. `vercel.json` rewrites `/api/*` to the function and everything else
  to `index.html`. Route order matters when paths overlap (e.g. `PUT /token` before `PUT /{user_id}`).
- `tests/server/` — pytest suite for the backend.
- `android/` — Capacitor project; it loads the deployed web app (`server.url` in `capacitor.config.ts`).

## Two data paths — the one thing to remember

The client reaches Supabase two ways. Through `src/Api` → FastAPI, the token is re-verified on
the server (posts, rides, notification send, FCM token in `user_devices`, self user update/delete,
community invite code, active-community switch). Through supabase-js directly, **Row-Level
Security is the only guard** (communities list, notification history, `CommitteeDashboard` reads,
onboarding `users.createProfile`). The phonebook is `rpc('get_phonebook')`, not a `select` on
`users`. Invite codes are not a direct column — `CommunitySettingsTab` loads them from
`GET /api/communities/active/invite-code` (committee only). New feature that needs role checks
or server-side logic → FastAPI. Plain read of community-visible data → direct, only after
confirming an RLS policy covers it ([docs/RLS-AUDIT.md](docs/RLS-AUDIT.md)). When unsure, FastAPI.
Do not add `select *` on a direct query; name the columns.

## Environment variables

Listed in [README.md](README.md) and `.env.example`. Frontend variables are build-time and need
the `VITE_` prefix; `SUPABASE_SERVICE_KEY` and `FIREBASE_CREDENTIALS` are server-only and must
never be referenced from `src/` outside `src/server/`.

## Before a non-trivial change

Scan the trackers in `docs/` — [TECH-DEBT.md](docs/TECH-DEBT.md), [UI-AUDIT.md](docs/UI-AUDIT.md),
[RLS-AUDIT.md](docs/RLS-AUDIT.md). A tracked finding may already overlap the change; tick its box
in the same diff.
