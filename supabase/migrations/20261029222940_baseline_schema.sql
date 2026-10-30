-- 20261029222940_baseline_schema.sql — schema-only baseline of PRODUCTION (Supabase ref crhhgcisokrjehnyviya)
-- Generated 2026-10-29 (Asia/Jerusalem) from read-only catalog queries (pg_catalog / pg_get_*def / pg_policies).
-- Prod: PostgreSQL 17.6. Scope: public schema + auth.users trigger + storage buckets/policies + realtime publication.
-- NO data, NO secrets. Intended to be applied FIRST on a fresh local `supabase start`, then 01_, 02_.
-- Reproduces the CURRENT (vulnerable) prod state on purpose — do not "fix" it here.

-- ── 1. extensions (all present by default on Supabase; listed for completeness) ──
create extension if not exists "pgcrypto"           with schema extensions;
create extension if not exists "uuid-ossp"          with schema extensions;
create extension if not exists "pg_stat_statements" with schema extensions;
create extension if not exists "pg_graphql"         with schema graphql;
create extension if not exists "supabase_vault"     with schema vault;
-- (plpgsql is built in.) No custom enums, domains, composite types or sequences exist in public.

-- ── 2. tables ──
create table if not exists public.businesses (
  id uuid default gen_random_uuid() not null,
  community_id uuid not null,
  owner_id uuid not null,
  name text not null,
  description text,
  phone text,
  address text,
  category text,
  is_verified_by_committee boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.communities (
  id uuid default gen_random_uuid() not null,
  name text not null,
  city_symbol text,
  logo_url text,
  subscription_status text default 'active'::text,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  invite_code text default upper(SUBSTRING(md5(((random())::text || (clock_timestamp())::text)) FROM 1 FOR 8)) not null
);

create table if not exists public.important_notifications (
  id uuid default gen_random_uuid() not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  community_id uuid not null,
  title text not null,
  body text not null,
  sender_name text,
  is_emergency boolean default false
);

create table if not exists public.posts (
  id uuid default gen_random_uuid() not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid not null,
  content text,
  image_url text,
  is_committee boolean default false,
  community_id uuid not null
);

create table if not exists public.rides (
  id uuid default gen_random_uuid() not null,
  driver_name text,
  location text,
  destination text,
  departure_time timestamp with time zone,
  seats integer,
  created_date timestamp with time zone,
  user_id uuid not null,
  community_id uuid not null,
  type text default 'offer'::text
);

create table if not exists public.transport_schedules (
  id uuid default gen_random_uuid() not null,
  community_id uuid not null,
  title text not null,
  departure_time time without time zone not null,
  days_active text[],
  pickup_location text,
  dropoff_location text,
  driver_name text,
  driver_phone text,
  price numeric default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.user_communities (
  user_id uuid not null,
  community_id uuid not null,
  role text default 'resident'::text not null,
  joined_at timestamp with time zone default now() not null
);

create table if not exists public.user_devices (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  fcm_token text not null,
  device_type text,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.users (
  id uuid default gen_random_uuid() not null,
  email text,
  "firstName" text,
  "lastName" text,
  city text,
  address text,
  age integer,
  phone text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  community_id uuid,
  community_role text default 'resident'::text,
  is_verified_as_resident boolean default false,
  visible_on_phonebook boolean default false,
  avatar_url text,
  bio character varying(200),
  address_visibility text default 'committee'::text,
  notify_posts boolean default true,
  notify_committee_posts boolean default true,
  notify_ride_offers boolean default true,
  notify_ride_requests boolean default true
);

-- ── 3. constraints (PK/UNIQUE, then CHECK, then FK) ──
alter table public.businesses add constraint businesses_pkey PRIMARY KEY (id);
alter table public.communities add constraint communities_pkey PRIMARY KEY (id);
alter table public.important_notifications add constraint important_notifications_pkey PRIMARY KEY (id);
alter table public.posts add constraint posts_pkey PRIMARY KEY (id);
alter table public.rides add constraint rides_pkey PRIMARY KEY (id);
alter table public.transport_schedules add constraint transport_schedules_pkey PRIMARY KEY (id);
alter table public.user_communities add constraint user_communities_pkey PRIMARY KEY (user_id, community_id);
alter table public.user_devices add constraint user_devices_pkey PRIMARY KEY (id);
alter table public.users add constraint users_pkey PRIMARY KEY (id);
alter table public.communities add constraint communities_invite_code_unique UNIQUE (invite_code);
alter table public.user_devices add constraint user_devices_user_id_fcm_token_key UNIQUE (user_id, fcm_token);
alter table public.users add constraint users_email_key UNIQUE (email);
alter table public.rides add constraint rides_type_check CHECK ((type = ANY (ARRAY['offer'::text, 'request'::text])));
alter table public.user_communities add constraint user_communities_role_check CHECK ((role = ANY (ARRAY['resident'::text, 'committee'::text])));
alter table public.users add constraint users_address_visibility_check CHECK ((address_visibility = ANY (ARRAY['everyone'::text, 'committee'::text, 'nobody'::text])));
alter table public.businesses add constraint businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.businesses add constraint businesses_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id);
alter table public.important_notifications add constraint important_notifications_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
alter table public.posts add constraint posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id);
alter table public.posts add constraint posts_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.rides add constraint rides_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.rides add constraint rides_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id);
alter table public.transport_schedules add constraint transport_schedules_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id);
alter table public.user_communities add constraint user_communities_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
alter table public.user_communities add constraint user_communities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_devices add constraint user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.users add constraint users_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id);
alter table public.users add constraint users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- No standalone (non-constraint) indexes exist in public.

comment on column public.rides.user_id is 'קישור הנהג לנסיעות שיצר';

-- ── 4. functions (verbatim pg_get_functiondef; all owned by postgres) ──
CREATE OR REPLACE FUNCTION public.get_my_community_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    my_cid UUID;
BEGIN
    SELECT community_id INTO my_cid
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN my_cid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_privileged_user_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Trusted server/admin context (service key, SQL editor) has no auth.uid();
  -- allow it (the backend never changes these columns anyway).
  if auth.uid() is null then
    return new;
  end if;

  if (new.community_role is distinct from old.community_role)
     or (new.is_verified_as_resident is distinct from old.is_verified_as_resident) then
    -- Only a committee member of the row's existing community may change these.
    if not public.is_committee_of(old.community_id) then
      raise exception 'Not allowed to change role or verification status';
    end if;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_committee_of(target_community_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() -- מי שמריץ את השאילתה
    AND community_role = 'committee' -- האם הוא ועד?
    AND community_id = target_community_id -- האם הוא שייך לקהילה שנבדקת?
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_community_by_name(requested_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  target_community_id UUID;
  current_user_community UUID;
BEGIN
  -- 1. בדיקה: האם המשתמש כבר משויך לקהילה?
  SELECT community_id INTO current_user_community
  FROM public.users
  WHERE id = auth.uid();

  IF current_user_community IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already assigned to a community');
  END IF;

  -- 2. מציאת ה-ID של הקהילה לפי השם
  SELECT id INTO target_community_id
  FROM public.communities
  WHERE name = requested_name
  LIMIT 1;

  IF target_community_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Community not found');
  END IF;

  -- 3. ביצוע השיוך
  UPDATE public.users
  SET community_id = target_community_id,
      -- אנחנו בכוונה לא מאשרים אותו כתושב, אלא רק משייכים
      is_verified_as_resident = false 
  WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true, 'community_id', target_community_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_community_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.community_id IS DISTINCT FROM OLD.community_id THEN
    -- Initial assignment (OLD is NULL) is always allowed — that's the
    -- existing onboarding flow.
    IF OLD.community_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Service-role / SQL editor context — auth.uid() is NULL. Trust the
    -- backend (it validates membership in /api/communities/active before
    -- doing the UPDATE).
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    -- Client-side switch: only allowed if the target community is in the
    -- user's user_communities memberships. This makes direct supabase-js
    -- updates safe too — they can only switch among joined communities.
    IF NOT EXISTS (
      SELECT 1 FROM public.user_communities
      WHERE user_id = NEW.id AND community_id = NEW.community_id
    ) THEN
      RAISE EXCEPTION 'You can only switch to a community you have joined.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_from_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- 1. יצירת רשומה ראשונית בעת הרשמה
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (
      NEW.id, 
      NEW.email, 
      NEW.created_at, 
      now()
    )
    ON CONFLICT (id) DO NOTHING; 
    -- שים לב: אנחנו לא מכניסים שום שדה אחר, הכל יהיה NULL כברירת מחדל

  -- 2. עדכון טכני (Login או שינוי אימייל)
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE public.users
    SET
      email = NEW.email, -- מסנכרן למקרה שהמשתמש שינה מייל דרך המערכת של סופבייס
      last_sign_in_at = NEW.last_sign_in_at,
      updated_at = now()
    WHERE id = NEW.id;
    -- שים לב: אנחנו לא נוגעים ב-firstName, city וכו'.
    -- זה מבטיח שהמידע שהמשתמש ימלא ב-Onboarding לא יידרס לעולם ע"י הטריגר הזה.
  END IF;

  RETURN NEW;
END;
$function$;

-- ── 5. views ──
create or replace view public.phonebook_visible with (security_invoker=true) as
 SELECT id,
    "firstName",
    "lastName",
    phone,
    city,
    avatar_url,
    bio,
    community_id,
    community_role,
    created_at,
    visible_on_phonebook,
        CASE
            WHEN (address_visibility = 'everyone'::text) THEN address
            WHEN ((address_visibility = 'committee'::text) AND (EXISTS ( SELECT 1
               FROM public.users me
              WHERE ((me.id = auth.uid()) AND (me.community_role = 'committee'::text) AND (me.community_id = u.community_id))))) THEN address
            ELSE NULL::text
        END AS address
   FROM public.users u;

-- ── 6. row level security flags (enabled on all 9 tables, FORCE on none) ──
alter table public.businesses enable row level security;
alter table public.communities enable row level security;
alter table public.important_notifications enable row level security;
alter table public.posts enable row level security;
alter table public.rides enable row level security;
alter table public.transport_schedules enable row level security;
alter table public.user_communities enable row level security;
alter table public.user_devices enable row level security;
alter table public.users enable row level security;

-- ── 7. policies (exactly as live; expressions schema-qualified only) ──
drop policy if exists "Businesses viewable by community members" on public.businesses;
create policy "Businesses viewable by community members" on public.businesses as permissive for select to public
  using (((auth.uid() = owner_id) OR (community_id = public.get_my_community_id())));

drop policy if exists "Owners and committee can update businesses" on public.businesses;
create policy "Owners and committee can update businesses" on public.businesses as permissive for update to public
  using (((auth.uid() = owner_id) OR public.is_committee_of(community_id)));

drop policy if exists "Users can create businesses" on public.businesses;
create policy "Users can create businesses" on public.businesses as permissive for insert to public
  with check ((auth.uid() = owner_id));

drop policy if exists "Public communities are viewable by everyone" on public.communities;
create policy "Public communities are viewable by everyone" on public.communities as permissive for select to public
  using (true);

drop policy if exists "Committee members can insert notifications" on public.important_notifications;
create policy "Committee members can insert notifications" on public.important_notifications as permissive for insert to public
  with check (public.is_committee_of(community_id));

drop policy if exists "Users can view notifications from their community" on public.important_notifications;
create policy "Users can view notifications from their community" on public.important_notifications as permissive for select to public
  using ((community_id IN ( SELECT users.community_id
   FROM public.users
  WHERE (users.id = auth.uid()))));

drop policy if exists "Only committee can manage transport" on public.transport_schedules;
create policy "Only committee can manage transport" on public.transport_schedules as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.community_role = 'committee'::text)))));

drop policy if exists "Transport schedules viewable by everyone" on public.transport_schedules;
create policy "Transport schedules viewable by everyone" on public.transport_schedules as permissive for select to public
  using (true);

drop policy if exists "uc_delete_self" on public.user_communities;
create policy "uc_delete_self" on public.user_communities as permissive for delete to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)));

drop policy if exists "uc_insert_self" on public.user_communities;
create policy "uc_insert_self" on public.user_communities as permissive for insert to authenticated
  with check ((user_id = ( SELECT auth.uid() AS uid)));

drop policy if exists "uc_select_own_or_committee" on public.user_communities;
create policy "uc_select_own_or_committee" on public.user_communities as permissive for select to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR (community_id IN ( SELECT uc.community_id
   FROM public.user_communities uc
  WHERE ((uc.user_id = ( SELECT auth.uid() AS uid)) AND (uc.role = 'committee'::text))))));

drop policy if exists "Users can insert own devices" on public.user_devices;
create policy "Users can insert own devices" on public.user_devices as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "Users can view own devices" on public.user_devices;
create policy "Users can view own devices" on public.user_devices as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "Committee can update community members" on public.users;
create policy "Committee can update community members" on public.users as permissive for update to public
  using (public.is_committee_of(community_id));

drop policy if exists "Committee can view all community members" on public.users;
create policy "Committee can view all community members" on public.users as permissive for select to public
  using (public.is_committee_of(community_id));

drop policy if exists "Members can view phonebook participants" on public.users;
create policy "Members can view phonebook participants" on public.users as permissive for select to public
  using (((visible_on_phonebook = true) AND (community_id = public.get_my_community_id())));

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users as permissive for update to public
  using ((auth.uid() = id));

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users as permissive for select to public
  using ((auth.uid() = id));

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects as permissive for insert to authenticated
  with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

drop policy if exists "avatars_owner_select" on storage.objects;
create policy "avatars_owner_select" on storage.objects as permissive for select to authenticated
  using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects as permissive for update to authenticated
  using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))))
  with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

-- ── 8. triggers ──
drop trigger if exists on_auth_user_upsert on auth.users;
CREATE TRIGGER on_auth_user_upsert AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_user_from_auth();

drop trigger if exists check_community_update on public.users;
CREATE TRIGGER check_community_update BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.prevent_community_change();

drop trigger if exists trg_guard_privileged_user_columns on public.users;
CREATE TRIGGER trg_guard_privileged_user_columns BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.guard_privileged_user_columns();

-- ── 9. grants (as live: Supabase defaults; anon lacks SELECT on phonebook_visible) ──
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.businesses to anon, authenticated, service_role;
grant all on table public.communities to anon, authenticated, service_role;
grant all on table public.important_notifications to anon, authenticated, service_role;
grant all on table public.phonebook_visible to anon, authenticated, service_role;
grant all on table public.posts to anon, authenticated, service_role;
grant all on table public.rides to anon, authenticated, service_role;
grant all on table public.transport_schedules to anon, authenticated, service_role;
grant all on table public.user_communities to anon, authenticated, service_role;
grant all on table public.user_devices to anon, authenticated, service_role;
grant all on table public.users to anon, authenticated, service_role;
revoke select on table public.phonebook_visible from anon;  -- live ACL anon=awdDxtm
-- no column-level ACLs exist
grant execute on function public.get_my_community_id() to public, anon, authenticated, service_role;
grant execute on function public.guard_privileged_user_columns() to public, anon, authenticated, service_role;
grant execute on function public.is_committee_of(uuid) to public, anon, authenticated, service_role;
grant execute on function public.join_community_by_name(text) to public, anon, authenticated, service_role;
grant execute on function public.prevent_community_change() to public, anon, authenticated, service_role;
grant execute on function public.sync_user_from_auth() to public, anon, authenticated, service_role;

-- ── 10. realtime publication membership (only public.users) ──
do $$ begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='users') then
    alter publication supabase_realtime add table public.users;
  end if;
end $$;

-- ── 11. storage buckets (both public, no size/mime limits). Storage policies are in section 7. ──
insert into storage.buckets (id, name, public) values ('avatars','avatars', true), ('images','images', true)
  on conflict (id) do nothing;
-- 'images' has no storage.objects policies on prod (FastAPI uploads with the service role).
