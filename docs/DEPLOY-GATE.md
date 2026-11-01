# Production deploy gate (issue #16)

Production traffic must not move to a new `main` build until GitHub CI passes. Preview deployments for branches and pull requests stay unchanged so QA can keep using PR preview URLs.

## Approach: Vercel Deployment Checks (GitHub)

We use [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks) with the **GitHub** provider. Vercel still builds production on every push to `main`, but it **does not assign the production domain** until the selected GitHub Actions checks on that commit are green. Failed CI leaves the previous production deployment serving users.

This needs **no new repository secrets** and does not use `ignoreCommand` polling (which can cancel a deploy while CI is still running and never retry when CI finishes).

### One-time setup (Vercel dashboard — owner action)

Do **not** skip this step; the repo changes alone do not enable the gate.

1. Open the project: [commun-it-is](https://vercel.com/avior-paz-s-projects/commun-it-is) (`prj_Qlk3WkUjQ4mOP53igStc0xt0cihS`), team **avior-paz-s-projects**.
2. Confirm **Git** is linked to `avi720/Commun-It-Is` (Project → Settings → Git).
3. Confirm **Production** has automatic aliasing enabled (Project → Settings → Environments → Production).
4. Go to **Project → Settings → Deployment Checks** → **Add Checks** → provider **GitHub**.
5. Require these three checks (names must match the `name:` fields in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)):
   - `Frontend (lint + build + vitest)`
   - `Backend (pytest)`
   - `Database (local Supabase pgTAP)`
6. Scope the checks to **Production** only (not Preview), so PR/branch preview URLs deploy as today.

After setup, a failing job on `main` shows a production deployment in **Ready** (or similar) with deployment checks pending/failed; `commun-it-is.vercel.app` stays on the last passing release until all three checks succeed.

To ship despite a stuck check, use **Force Promote** on the deployment (documented in Vercel’s Deployment Checks guide) — use only for emergencies.

### What stays in Git

- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — source of truth for the three required jobs.
- This file — operator runbook.

Renaming CI jobs requires updating the same names in Vercel Deployment Checks.

### Alternatives considered

| Option | Why not chosen |
|--------|----------------|
| `vercel.json` `ignoreCommand` + GitHub API | Race with CI start; skipping the build does not retry when CI later passes. |
| Disable Git deploy + Actions `vercel deploy --prod` | Requires `VERCEL_TOKEN` and more workflow maintenance. |
| GitHub branch protection only | Does not stop Vercel’s Git integration from promoting production on push to `main`. |
