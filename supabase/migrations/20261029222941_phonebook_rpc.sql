-- Migration 1 of 2. Additive: safe to apply before the frontend deploy.
-- The phonebook keeps working on the old view until migration 2.
-- Adds a SECURITY DEFINER phonebook RPC that returns only safe columns for the
-- caller's active community, so the users-table phonebook policy can be dropped in 02.

create or replace function public.get_phonebook()
returns table (
  id uuid, "firstName" text, "lastName" text, phone text, city text,
  avatar_url text, bio varchar(200), community_id uuid, community_role text,
  created_at timestamptz, visible_on_phonebook boolean, address text
)
language sql stable security definer set search_path = public
as $$
  select u.id, u."firstName", u."lastName", u.phone, u.city, u.avatar_url, u.bio,
         u.community_id, u.community_role, u.created_at, u.visible_on_phonebook,
         case
           when u.id = auth.uid() then u.address
           when u.address_visibility = 'everyone' then u.address
           when u.address_visibility = 'committee' and public.is_committee_of(u.community_id) then u.address
           else null
         end as address
  from public.users u
  where auth.uid() is not null
    and u.community_id = public.get_my_community_id()
    and (u.visible_on_phonebook = true or u.id = auth.uid() or public.is_committee_of(u.community_id))
  order by u."firstName";
$$;

revoke all on function public.get_phonebook() from public, anon;
grant execute on function public.get_phonebook() to authenticated;
