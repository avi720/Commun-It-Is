-- Migration 2 of 2. BREAKING for the old phonebook client.
-- Apply only after the frontend that calls rpc('get_phonebook') and selects
-- explicit community columns is deployed. Applying this first makes the
-- phonebook (and any select *) fail.
-- Closes issue #10 gaps G1–G9.

-- ───────────── G1/G2: user_communities — no forged memberships, no recursion ─────────────
drop policy if exists uc_insert_self on public.user_communities;   -- joins go through FastAPI (service role) or the RPC below
drop policy if exists uc_delete_self on public.user_communities;   -- leave goes through FastAPI (keeps "last membership" rule)
drop policy if exists uc_select_own_or_committee on public.user_communities;
create policy uc_select_own_or_committee on public.user_communities
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_committee_of(community_id));  -- definer fn → no 42P17 recursion
revoke all on public.user_communities from anon;
revoke insert, update, delete, truncate on public.user_communities from authenticated;

-- ───────────── G1/G3/G6: one guard trigger for every client-side UPDATE on users ─────────────
create or replace function public.guard_privileged_user_columns()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  m_role text;
begin
  -- service role / SQL editor / GoTrue sync: no JWT subject → trusted
  if auth.uid() is null then
    return new;
  end if;

  -- identity columns are never client-writable
  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at
     or new.last_sign_in_at is distinct from old.last_sign_in_at then
    raise exception 'Not allowed to change identity columns';
  end if;

  -- committee editing SOMEONE ELSE: only role / verification may change
  if new.id <> auth.uid() then
    if (to_jsonb(new) - 'community_role' - 'is_verified_as_resident' - 'updated_at')
       is distinct from
       (to_jsonb(old) - 'community_role' - 'is_verified_as_resident' - 'updated_at') then
      raise exception 'Committee may only change role or verification status';
    end if;
  end if;

  -- active-community change by the user themself
  if new.community_id is distinct from old.community_id then
    if new.id <> auth.uid() then
      raise exception 'Only the user can change their active community';
    end if;
    if old.community_id is null then
      -- first assignment (legacy onboarding): always an unverified resident
      new.community_role := 'resident';
      new.is_verified_as_resident := false;
      insert into public.user_communities (user_id, community_id, role)
        values (new.id, new.community_id, 'resident')
        on conflict do nothing;
      return new;
    end if;
    select uc.role into m_role
      from public.user_communities uc
     where uc.user_id = new.id and uc.community_id = new.community_id;
    if m_role is null then
      raise exception 'You can only switch to a community you have joined.';
    end if;
    new.community_role := m_role;                                   -- role comes from the membership, never carried over
    new.is_verified_as_resident := old.is_verified_as_resident;     -- not client-forgeable on switch
    return new;
  end if;

  -- role / verification change without a community change: committee of that community only
  if new.community_role is distinct from old.community_role
     or new.is_verified_as_resident is distinct from old.is_verified_as_resident then
    if not public.is_committee_of(old.community_id) then
      raise exception 'Not allowed to change role or verification status';
    end if;
  end if;

  return new;
end;
$$;

-- the old community-change trigger is folded into the guard above
drop trigger if exists check_community_update on public.users;
drop function if exists public.prevent_community_change();
revoke all on function public.guard_privileged_user_columns() from public, anon, authenticated;
revoke all on function public.sync_user_from_auth() from public, anon, authenticated;

-- ───────────── G3: users policies — WITH CHECK, authenticated only, no peer full-row reads ─────────────
drop policy if exists "Members can view phonebook participants" on public.users;   -- G4: replaced by rpc get_phonebook()
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Committee can view all community members" on public.users;
create policy "Committee can view all community members" on public.users
  for select to authenticated using (public.is_committee_of(community_id));
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "Committee can update community members" on public.users;
create policy "Committee can update community members" on public.users
  for update to authenticated
  using (public.is_committee_of(community_id)) with check (public.is_committee_of(community_id));
revoke all on public.users from anon;
revoke insert, delete, truncate on public.users from authenticated;   -- insert = auth trigger, delete = FastAPI

-- the old invoker view now only returns self/committee rows; drop it once nothing reads it
drop view if exists public.phonebook_visible;

-- ───────────── G5: communities — signed-in only, hide invite_code / billing / settings ─────────────
drop policy if exists "Public communities are viewable by everyone" on public.communities;
create policy "Communities readable by signed-in users" on public.communities
  for select to authenticated using (true);
revoke all on public.communities from anon;
revoke all on public.communities from authenticated;
grant select (id, name, city_symbol, logo_url, created_at) on public.communities to authenticated;

-- legacy join-by-name RPC: pin search_path, signed-in only, and record the membership
create or replace function public.join_community_by_name(requested_name text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  target_community_id uuid;
  current_user_community uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;
  select community_id into current_user_community from public.users where id = auth.uid();
  if current_user_community is not null then
    return jsonb_build_object('success', false, 'error', 'User is already assigned to a community');
  end if;
  select id into target_community_id from public.communities where name = requested_name limit 1;
  if target_community_id is null then
    return jsonb_build_object('success', false, 'error', 'Community not found');
  end if;
  update public.users
     set community_id = target_community_id, community_role = 'resident', is_verified_as_resident = false
   where id = auth.uid();
  insert into public.user_communities (user_id, community_id, role)
    values (auth.uid(), target_community_id, 'resident') on conflict do nothing;
  return jsonb_build_object('success', true, 'community_id', target_community_id);
end;
$$;
revoke all on function public.join_community_by_name(text) from public, anon;
grant execute on function public.join_community_by_name(text) to authenticated;
revoke all on function public.is_committee_of(uuid) from public, anon;
grant execute on function public.is_committee_of(uuid) to authenticated;
revoke all on function public.get_my_community_id() from public, anon;
grant execute on function public.get_my_community_id() to authenticated;

-- ───────────── G7: businesses — no self-approval, no cross-community moves ─────────────
drop policy if exists "Businesses viewable by community members" on public.businesses;
create policy "Businesses viewable by community members" on public.businesses
  for select to authenticated
  using (owner_id = (select auth.uid()) or community_id = public.get_my_community_id());
drop policy if exists "Users can create businesses" on public.businesses;
create policy "Users can create businesses" on public.businesses
  for insert to authenticated
  with check (owner_id = (select auth.uid())
              and community_id = public.get_my_community_id()
              and coalesce(is_verified_by_committee, false) = false);
drop policy if exists "Owners and committee can update businesses" on public.businesses;
create policy "Owners and committee can update businesses" on public.businesses
  for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_committee_of(community_id))
  with check (owner_id = (select auth.uid()) or public.is_committee_of(community_id));

create or replace function public.guard_business_columns()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if;
  if new.community_id is distinct from old.community_id or new.owner_id is distinct from old.owner_id then
    raise exception 'Not allowed to move or re-own a business';
  end if;
  if new.is_verified_by_committee is distinct from old.is_verified_by_committee
     and not public.is_committee_of(old.community_id) then
    raise exception 'Only the committee can verify a business';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_guard_business_columns on public.businesses;
create trigger trg_guard_business_columns before update on public.businesses
  for each row execute function public.guard_business_columns();
revoke all on function public.guard_business_columns() from public, anon, authenticated;
revoke all on public.businesses from anon;
revoke delete, truncate on public.businesses from authenticated;

-- ───────────── G8: important_notifications — authenticated only (policies already correct) ─────────────
drop policy if exists "Users can view notifications from their community" on public.important_notifications;
create policy "Users can view notifications from their community" on public.important_notifications
  for select to authenticated using (community_id = public.get_my_community_id());
drop policy if exists "Committee members can insert notifications" on public.important_notifications;
create policy "Committee members can insert notifications" on public.important_notifications
  for insert to authenticated with check (public.is_committee_of(community_id));
revoke all on public.important_notifications from anon;
revoke update, delete, truncate on public.important_notifications from authenticated;

-- ───────────── G9: transport_schedules (unused) — per-community, no anon ─────────────
drop policy if exists "Transport schedules viewable by everyone" on public.transport_schedules;
create policy "Transport schedules viewable by community members" on public.transport_schedules
  for select to authenticated using (community_id = public.get_my_community_id());
drop policy if exists "Only committee can manage transport" on public.transport_schedules;
create policy "Committee manages own community transport" on public.transport_schedules
  for all to authenticated
  using (public.is_committee_of(community_id)) with check (public.is_committee_of(community_id));
revoke all on public.transport_schedules from anon;

-- ───────────── posts / rides / user_devices: locked tables — drop unused anon grants ─────────────
revoke all on public.posts, public.rides, public.user_devices from anon;
revoke truncate on public.posts, public.rides, public.user_devices from authenticated;

-- ───────────── G4: realtime must not stream full user rows ─────────────
-- ResidentVerificationPending listens for UPDATE on the caller's own row and
-- only reads is_verified_as_resident. Publishing the whole row would put
-- address and email on the realtime socket for anyone whose SELECT policy
-- matches (committee members, and previously every phonebook reader).
do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'users'
  ) then
    alter publication supabase_realtime drop table public.users;
  end if;
  alter publication supabase_realtime add table public.users (id, is_verified_as_resident);
end $$;
