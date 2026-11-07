# Supabase RLS Audit

> **Last triaged:** 2026-10-31 — issue #14. Findings G1–G7 and G9 remain closed via issue #10 / PR #11; pgTAP + CI database job unchanged. Ops reminder: enable leaked-password protection in the Supabase dashboard (see Rollout).
> **First pass:** 2026-06-09, read-only `pg_policies` against project `crhhgcisokrjehnyviya`. That pass marked every direct-path table healthy. It was wrong — the expressions were copied, but they were not executed as `anon` or `authenticated`.
> **Closed:** 2026-10-29, issue #10 (PR #11). The production shape is the baseline migration. The fixes are the two migrations after it. Proof is `supabase/tests/rls_issue10_test.sql` on a local Supabase stack (`supabase test db --local`). Nothing here was applied to the hosted database.

## What was wrong

| ID | Sev | What a signed-in (or anonymous) client could do | Fix |
|---|---|---|---|
| G1 | critical | `INSERT` into `user_communities` as themselves with `role = 'committee'`. `PUT /api/communities/active` then copied that role onto `users.community_role` with the service role. Invite codes did not stop this: `anon` could `SELECT` every `communities.invite_code`. | No client insert/update/delete on `user_communities`. Joins go through FastAPI (service role) or `join_community_by_name`. `PUT /active` checks the membership and only copies `resident` or `committee` from that row. |
| G2 | high | `user_communities` SELECT policy queried `user_communities` again, so `authenticated` got `42P17` infinite recursion. | Policy calls `is_committee_of(community_id)` (security definer) instead of reading the same table. |
| G3 | high | `users` UPDATE policies had no `WITH CHECK`. `id`, `email`, `created_at`, and `last_sign_in_at` were writable by the row owner. | `WITH CHECK` on both UPDATE policies. `guard_privileged_user_columns` rejects identity changes and copies role from `user_communities` on a community switch. |
| G4 | critical | Phonebook SELECT on `users` returned the whole row (`address`, `email`, …), which skipped the `phonebook_visible` address filter. `users` was also in the `supabase_realtime` publication, so those columns rode along on postgres changes. | `get_phonebook()` returns the safe columns and applies `address_visibility`. The broad SELECT policy is gone. Realtime publishes only `id` and `is_verified_as_resident` (the resident-verification screen). |
| G5 | high | `anon` could read `communities`, including `invite_code`, `settings`, and `subscription_status`. | `anon` has no grant. Signed-in users may select `id, name, city_symbol, logo_url, created_at` only. |
| G6 | high | Security-definer functions had a mutable `search_path` (`join_community_by_name`, `prevent_community_change`). `anon` could execute them and held `TRUNCATE` on the public tables. | `search_path` pinned. Execute revoked from `anon` / `public` except the two RPCs the app calls, which are `authenticated` only. `anon` table grants removed. |
| G7 | high | A business owner could set `is_verified_by_committee` or move `community_id` / `owner_id`. | Insert `WITH CHECK` requires an unverified business in the caller's community. `guard_business_columns` blocks moves, re-ownership, and self-verification. |
| G9 | medium | `transport_schedules` SELECT was `true`, and the write policy treated any committee member as global. | Read and write are `get_my_community_id()` / `is_committee_of(community_id)`. No `anon` grant. |

G8 (`important_notifications`) already scoped rows correctly. Migration 2 tightens it to `authenticated` and drops anon grants. `posts` and `rides` stay RLS-on with zero policies (FastAPI + service role only).

## How the client is allowed to touch data now

| Table / call | Who | What |
|---|---|---|
| `users` SELECT | the row owner, or a committee member of that `community_id` | Full row for those people only. Not a phonebook. |
| `users` UPDATE | owner, or committee of that community | Owner cannot change identity, role, or verification. Committee of someone else can change only `community_role` and `is_verified_as_resident`. |
| `rpc('get_phonebook')` | signed-in member | Safe columns for the active community. Address is null unless visibility allows it. |
| `communities` SELECT | signed-in | `id, name, city_symbol, logo_url, created_at`. |
| `GET /api/communities/active/invite-code` | committee of the active community | The invite code. Not readable via supabase-js. |
| `user_communities` SELECT | own rows, or committee of that community | No insert, update, or delete for `authenticated`. |
| `businesses` | members of the community, owners | Owners cannot verify or move a business. Committee can verify. |
| `important_notifications` | active community | Committee insert only. |
| `transport_schedules` | active community | Committee of that community manages rows. |
| `user_devices` | service role (FastAPI upsert); owner may select/insert via RLS but the app does not use that path | FCM tokens live here only — `PUT` token handler upserts with the service role. Not a column on `users`. `anon` grants dropped in the issue #10 close migration. |
| `posts`, `rides` | service role | No policies. Direct supabase-js gets nothing. |

`join_community_by_name` is still the onboarding RPC. It only works when `users.community_id` is null, forces `resident` + unverified, and inserts the membership. A second call returns "already assigned".

Sign-up and sign-in still sync `public.users`. `sync_user_from_auth` is the trigger on `auth.users`. It runs as definer with no JWT, so the guard lets it set `email` and `last_sign_in_at`. The pgTAP file asserts both directions.

Members still receive the invite code of communities they already belong to from `GET /api/communities/me` (service role), because the settings screen copies it. They cannot list codes for communities they have not joined.

## Rollout

Apply in this order. Migration 2 before the new frontend breaks the phonebook (`phonebook_visible` is dropped and `users` no longer has the phonebook SELECT).

1. Apply `20261029222941_phonebook_rpc.sql` (additive).
2. Deploy the frontend and API in this change (phonebook RPC, explicit column lists, invite-code endpoint, profile whitelist, membership check on `PUT /active`).
3. Apply `20261029222942_close_rls_audit_issue10.sql`.

The baseline migration is the pre-fix production shape for local resets. Do not run it against the hosted database.

Also enable leaked-password protection in the dashboard: Authentication → Sign In / Providers → Email → "Prevent use of leaked passwords". That switch is not in a migration.

## Tests

```bash
supabase start          # local Docker stack only — never supabase link
supabase db reset
supabase test db --local
```

CI runs the same job on pull requests to `main` (`.github/workflows/ci.yml`, database job).
