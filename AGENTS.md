# AGENTS.md — Commun-It-Is

Guidance for coding agents working in this repository. Claude Code reads it through the
one-line `CLAUDE.md` next to it (`@AGENTS.md`); every nested `AGENTS.md` needs the same
companion — add one whenever you add a nested `AGENTS.md`.

A Hebrew (RTL) community app: rides, posts, phonebook and committee notifications. React SPA on
Vercel, a FastAPI backend in one Vercel Serverless Function, Supabase for data and auth, Firebase
Cloud Messaging for push, and a Capacitor wrapper in `android/` for a future store build.
The full picture lives in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — read it before touching
a feature; this file only holds what every task needs.

## Commands

| Task | Command |
|---|---|
| Frontend dev server | `npm run dev` → `http://localhost:5173` |
| Backend locally | `uvicorn src.server.main:app --reload --port 8000` (after `pip install -r requirements.txt`) |
| Lint / build / frontend tests | `npm run lint`, `npm run build`, `npm test` (Vitest) |
| Backend tests | `pytest tests/server -v` (deps in `requirements-dev.txt`) |

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs all of the above on Node 22 and
Python 3.13, plus `npm audit --audit-level=high`. Run the same set before pushing.

## Layout

- `src/Pages`, `src/Components` — React UI (Tailwind, shadcn-style primitives). State: React Query
  for data, `AppContext` only for `user` / `session` / `isAuthenticated`.
- `src/Api/*.js` — client wrappers that call the FastAPI backend with the user's bearer token.
- `src/server/` — FastAPI app (`main.py`, `routes/`, `auth.py`); `api/index.py` is the Vercel entry.
- `tests/server/` — pytest suite for the backend.
- `android/` — Capacitor project; it loads the deployed web app (`server.url` in `capacitor.config.ts`).

## Two data paths — the one thing to remember

The client reaches Supabase two ways. Through `src/Api` → FastAPI, the token is re-verified on
the server (posts, rides, notification send, FCM token, self user update/delete). Through
supabase-js directly, **Row-Level Security is the only guard** (phonebook, communities, notification
history, `CommitteeDashboard`, onboarding `users.createProfile`). New feature that needs role
checks or server-side logic → FastAPI. Plain read of community-visible data → direct, only after
confirming an RLS policy covers it ([docs/RLS-AUDIT.md](docs/RLS-AUDIT.md)). When unsure, FastAPI.

## Environment variables

Listed in [README.md](README.md) and `.env.example`. Frontend variables are build-time and need
the `VITE_` prefix; `SUPABASE_SERVICE_KEY` and `FIREBASE_CREDENTIALS` are server-only and must
never be referenced from `src/` outside `src/server/`.

## Before a non-trivial change

Scan the trackers in `docs/` — [TECH-DEBT.md](docs/TECH-DEBT.md), [UI-AUDIT.md](docs/UI-AUDIT.md),
[RLS-AUDIT.md](docs/RLS-AUDIT.md). A tracked finding may already overlap the change; tick its box
in the same diff.
