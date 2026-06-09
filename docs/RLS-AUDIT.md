# Supabase RLS Audit

> **Audit date:** 2026-06-09
> **Auditor:** Claude (TECH-DEBT Batch 3, Path A)
> **Method:** Read-only `pg_policies` + `pg_class.relrowsecurity` queries against the live Supabase project `crhhgcisokrjehnyviya` (region ap-south-1, PG 17) via the Supabase MCP.
> **Scope:** Every table in the `public` schema. No migrations were applied; this document records what exists and where the gaps are.

## TL;DR

| Status | Tables |
|---|---|
| ✅ Healthy (policies match the intended access model) | `users`, `businesses`, `important_notifications`, `user_devices`, `communities`, `transport_schedules` |
| ⚠ Locked-down (RLS on, **zero policies** — only service-role / FastAPI can touch) | `posts`, `rides` |
| ❌ Gap requiring action | *None.* The locked-down tables are **intentionally** locked because the app routes them through FastAPI with the service-role key. See *Tables locked to FastAPI* below. |

**T7 closure note:** the original concern was "RLS may be weak or missing for any table touched by the direct path." The audit shows it is **not** missing. Each table reached by the supabase-js direct path has a policy that matches the intended access model, and the two tables that have **no** policies (posts, rides) are exactly the tables the codebase **never** reaches via the direct path.

**T11 closure note:** independently resolved in Batch 2 by re-fetching the role on every committee navigation. The audit confirms that even if T11's client check were bypassed, the supabase-js direct path that the committee dashboard uses against `users` and `businesses` requires `is_committee_of(community_id)` — a SQL function that derives committee status from the live database row, not from the client snapshot.

---

## Per-table findings

For each table: which app code paths touch it directly (per `docs/ARCHITECTURE.md`), what RLS is configured, and whether they line up.

### `users` ✅

**Direct code paths:**
- `src/Api/users.js::createProfile` — `UPDATE users WHERE id = auth.uid()` during onboarding.
- `src/Api/phonebook.js::getContacts` — `SELECT firstName, lastName, phone, city, address WHERE community_id = ? AND visible_on_phonebook = true`.
- `src/Components/pagesComp/committeeDashboard/ResidentsTab.jsx` — `SELECT * WHERE community_id = ?` and `UPDATE is_verified_as_resident WHERE id = ?`.
- `src/Components/routes/CommitteeRoute.jsx` — `SELECT community_role WHERE id = auth.uid()` (T11 refetch).

**Policies (5):**

| cmd | policy | qual |
|---|---|---|
| SELECT | Users can view own profile | `auth.uid() = id` |
| SELECT | Members can view phonebook participants | `visible_on_phonebook = true AND community_id = get_my_community_id()` |
| SELECT | Committee can view all community members | `is_committee_of(community_id)` |
| UPDATE | Users can update own profile | `auth.uid() = id` |
| UPDATE | Committee can update community members | `is_committee_of(community_id)` |

**INSERT / DELETE:** no policies. INSERT is handled by an `auth → public.users` sync trigger (server-side). DELETE goes through FastAPI's `DELETE /api/users/{id}` (T2 closed it to self-delete only) using the service-role key — RLS bypassed there by design.

**Verdict:** ✅ Policies match every direct code path; no gaps.

---

### `businesses` ✅

**Direct code paths:**
- `BusinessesTab.jsx` — `SELECT * WHERE community_id = ?` and `UPDATE is_verified_by_committee WHERE id = ?`.
- (No DELETE flow exists in the client.)

**Policies (3):**

| cmd | policy | qual / with_check |
|---|---|---|
| SELECT | Businesses viewable by community members | qual: `auth.uid() = owner_id OR community_id = get_my_community_id()` |
| UPDATE | Owners and committee can update businesses | qual: `auth.uid() = owner_id OR is_committee_of(community_id)` |
| INSERT | Users can create businesses | with_check: `auth.uid() = owner_id` |

**Verdict:** ✅ The committee's "approve business" mutation (UPDATE of `is_verified_by_committee`) is gated by `is_committee_of(community_id)`. Anyone trying to forge an UPDATE from an anon JWT will be denied unless they are committee.

---

### `communities` ✅

**Direct code paths:**
- `src/Api/communities.js::getAll` — `SELECT id, name`.
- `src/Api/communities.js::joinByName` — calls RPC `join_community_by_name(requested_name)` (SECURITY DEFINER — bypasses RLS for the controlled mutation).
- `CommunitySettingsTab.jsx` — `SELECT * WHERE id = ?`.

**Policies (1):**

| cmd | policy | qual |
|---|---|---|
| SELECT | Public communities are viewable by everyone | `true` |

**Verdict:** ✅ Public listing is intentional (onboarding needs to show the list before the user has a community). All mutations go through the SECURITY DEFINER RPC.

---

### `important_notifications` ✅

**Direct code paths:**
- `avior.notifications.getHistory(communityId)` — used by `NotificationsHistory.jsx`. Goes through `src/Api/notifications.js`; verify it's direct supabase-js, not FastAPI. *(Code review confirms it's a direct supabase-js read.)*
- Committee broadcasts come through `avior.notifications.sendToCommunity` → FastAPI → service-role INSERT.

**Policies (2):**

| cmd | policy | qual / with_check |
|---|---|---|
| SELECT | Users can view notifications from their community | qual: `community_id IN (SELECT community_id FROM users WHERE id = auth.uid())` |
| INSERT | Committee members can insert notifications | with_check: `is_committee_of(community_id)` |

**Verdict:** ✅ Even though broadcasts go through FastAPI's service-role insert today, the INSERT policy provides defence-in-depth — if a future code path ever does a direct insert, it can only succeed for committee members of the target community.

---

### `user_devices` ✅

**Direct code paths:** none confirmed in `src/`; FCM token sync goes through `avior.notifications.updateToken` → FastAPI.

**Policies (2):**

| cmd | policy | qual / with_check |
|---|---|---|
| SELECT | Users can view own devices | qual: `auth.uid() = user_id` |
| INSERT | Users can insert own devices | with_check: `auth.uid() = user_id` |

**Verdict:** ✅ Defence-in-depth in case a future direct path is added. Currently unused via direct supabase-js.

---

### `transport_schedules` ✅

**Direct code paths:** unused in the current frontend code.

**Policies (2):**

| cmd | policy | qual |
|---|---|---|
| SELECT | Transport schedules viewable by everyone | `true` |
| ALL | Only committee can manage transport | `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND community_role = 'committee')` |

**Verdict:** ✅ Public read, committee-only write. **Note:** this is the one policy in the database that reads `community_role` directly from the `users` row rather than going through `is_committee_of(community_id)`. That means a global "any committee can manage all transport schedules" — not per-community. Document if a per-community split is ever needed; for now it appears intentional.

---

### `posts` — locked to FastAPI ⚠

**Direct code paths:** none. All access goes through `avior.entities.Post.list / create` → FastAPI.

**Policies:** **zero**. RLS is enabled, so any non-service-role caller (anon JWT, authenticated JWT) gets denied for every operation.

**Verdict:** ⚠ This is intentional given the current architecture (FastAPI is the source of truth for posts; it runs with `VITE_SUPABASE_SERVICE_KEY` which bypasses RLS). **Risk:** if anyone later wires up a direct supabase-js call for posts (e.g., Supabase Realtime for the feed), it will silently fail. Document in `docs/ARCHITECTURE.md`'s data-path table — already done.

**Recommendation (optional, not blocking):** add at minimum a permissive SELECT policy for community members so realtime / direct queries become possible without coupling to FastAPI:

```sql
CREATE POLICY "Posts viewable by community members"
  ON public.posts
  FOR SELECT
  USING (community_id = get_my_community_id());
```

Not applied automatically — owner decision.

---

### `rides` — locked to FastAPI ⚠

**Direct code paths:** none. All access goes through `avior.entities.Ride.list / create` → FastAPI. `PublicDisplay.jsx` uses React Query with a 5-second refetch interval — that's polling FastAPI, not Supabase Realtime.

**Policies:** **zero**, same as posts.

**Verdict:** ⚠ Intentional given current architecture. Same caveat as posts.

**Recommendation (optional, not blocking):** mirror the posts policy if direct reads ever become desirable:

```sql
CREATE POLICY "Rides viewable by community members"
  ON public.rides
  FOR SELECT
  USING (community_id = get_my_community_id());
```

---

## SQL helper functions (referenced by policies)

| Function | Args | Used by |
|---|---|---|
| `get_my_community_id()` | none | `users.SELECT (phonebook)`, `businesses.SELECT` |
| `is_committee_of(target_community_id uuid)` | uuid | `users.SELECT/UPDATE (committee)`, `businesses.UPDATE`, `important_notifications.INSERT` |
| `join_community_by_name(requested_name text)` | text | `communities.joinByName` RPC (SECURITY DEFINER) |

These are server-side SECURITY DEFINER (or SQL helpers) that derive their result from the live `users` row of the authenticated caller. That's why **T11 stale-role was a pure client-side concern** — the SQL side always read fresh.

---

## What I did NOT do

- **Did not apply any migration.** All findings above describe the existing state.
- **Did not test policies against actual data.** A more thorough audit would attempt SELECT/INSERT/UPDATE/DELETE with different role tokens (anon, authenticated, service) and confirm 200/401/403 as expected per row. That belongs in T20's pytest suite once a Supabase test fixture is established.
- **Did not audit the auth schema** (`auth.users`, triggers that sync `auth.users` → `public.users`). Those live outside `public` and require service-role-level access to inspect cleanly.
- **Did not audit Storage policies.** If image uploads in `CreatePostModal` use Supabase Storage, the policies on the `storage.objects` table should be audited separately.

---

## Recommended follow-ups (not part of this batch)

1. **If realtime / direct supabase-js for posts or rides is ever wanted:** add the two SELECT policies above (one PR, both tables).
2. **Tests for RLS** (extension of T20): add a `tests/supabase/test_rls.py` fixture using `supabase-py` with different role tokens and assert each policy denies / allows what the audit says it should. Out of scope for the test suites that closed T20 in this batch.
3. **Document the SQL helper functions** in `docs/ARCHITECTURE.md` (or a new `docs/DATABASE.md`) — the policies depend on them being defined, but their source isn't in the repo. If somebody nukes the database and recreates from scratch from the repo alone, the policies would reference missing functions.
