-- Security hardening — applied to production (Supabase project crhhgcisokrjehnyviya)
-- on 2026-06-03 via the Supabase MCP. Kept here for documentation/reproducibility.
--
-- NOTE: these were applied directly (not through `supabase db push`). If you adopt
-- the Supabase CLI migration workflow, reconcile this file with the migration
-- history before running a push so they are not applied twice.
--
-- Context: the committee management dashboard and the community gating relied on
-- client-side checks and RLS that had gaps. The biggest issue was that any user
-- could change their OWN `community_role`/`is_verified_as_resident` (the
-- "Users can update own profile" UPDATE policy had no column restriction),
-- letting a resident self-promote to committee and bypass every gate.

-- 1) CRITICAL: block self privilege-escalation on public.users.
--    A resident can no longer change their own role / verification status.
--    Only a committee member of the row's community may change them; a trusted
--    server/admin context (service key, SQL editor) has no auth.uid() and is allowed.
create or replace function public.guard_privileged_user_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if (new.community_role is distinct from old.community_role)
     or (new.is_verified_as_resident is distinct from old.is_verified_as_resident) then
    if not public.is_committee_of(old.community_id) then
      raise exception 'Not allowed to change role or verification status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_privileged_user_columns on public.users;
create trigger trg_guard_privileged_user_columns
before update on public.users
for each row execute function public.guard_privileged_user_columns();

-- 2) Scope businesses UPDATE to the same community (was a global committee check,
--    letting a committee member of community A edit community B's businesses).
drop policy "Owners and committee can update businesses" on public.businesses;
create policy "Owners and committee can update businesses"
on public.businesses for update
using ( auth.uid() = owner_id or public.is_committee_of(community_id) );

-- 3) Fix the tautological with_check (community_id = community_id) on the
--    notifications insert policy so it actually verifies the caller's community.
drop policy "Committee members can insert notifications" on public.important_notifications;
create policy "Committee members can insert notifications"
on public.important_notifications for insert
with check ( public.is_committee_of(community_id) );

-- 4) Restrict businesses visibility to members of the same community (or the owner).
--    Previously the SELECT policy used `qual = true`, exposing every community's
--    businesses to any authenticated user.
drop policy "Businesses viewable by community members" on public.businesses;
create policy "Businesses viewable by community members"
on public.businesses for select
using ( auth.uid() = owner_id or community_id = public.get_my_community_id() );
