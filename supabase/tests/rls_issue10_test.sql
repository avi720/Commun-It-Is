-- pgTAP coverage for issue #10. Runs on the local stack after every migration.
-- The whole file is one transaction and rolls back, so it leaves no rows behind.
begin;
create extension if not exists pgtap with schema extensions;
select plan(43);

-- GoTrue's auth.users has several NOT NULL token columns. Unique tokens avoid
-- colliding on the empty-string unique indexes some versions add.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, email_change_token_current, reauthentication_token
) values
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000c1','authenticated','authenticated','c@test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'ct-c1','rt-c1','en-c1','','ec-c1','ra-c1'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000a1','authenticated','authenticated','r1@test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'ct-a1','rt-a1','en-a1','','ec-a1','ra-a1'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000a2','authenticated','authenticated','r2@test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'ct-a2','rt-a2','en-a2','','ec-a2','ra-a2'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000a3','authenticated','authenticated','r3@test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'ct-a3','rt-a3','en-a3','','ec-a3','ra-a3'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000b1','authenticated','authenticated','rb@test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'ct-b1','rt-b1','en-b1','','ec-b1','ra-b1'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000d1','authenticated','authenticated','n1@test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'ct-d1','rt-d1','en-d1','','ec-d1','ra-d1');

-- 1. The auth trigger still creates public.users after migration 2 revoked EXECUTE.
select is(
  (select count(*) from public.users where id in (
    '00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1',
    '00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a3',
    '00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000d1'
  )),
  6::bigint,
  'sign-up trigger creates a public.users row for each auth user'
);

-- 2–3. Sign-in is an UPDATE of auth.users (GoTrue has no JWT). The sync trigger
-- must still copy email and last_sign_in_at; the guard allows that when auth.uid() is null.
update auth.users
   set email = 'c-renamed@test',
       last_sign_in_at = timestamptz '2026-10-29 12:00:00+00'
 where id = '00000000-0000-0000-0000-0000000000c1';
select is(
  (select email from public.users where id = '00000000-0000-0000-0000-0000000000c1'),
  'c-renamed@test',
  'sign-in sync copies email onto public.users'
);
select is(
  (select last_sign_in_at from public.users where id = '00000000-0000-0000-0000-0000000000c1'),
  timestamptz '2026-10-29 12:00:00+00',
  'sign-in sync copies last_sign_in_at'
);

-- 4. G6: every definer helper pins search_path.
select is(
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (array[
        'get_my_community_id','is_committee_of','join_community_by_name',
        'get_phonebook','guard_privileged_user_columns','guard_business_columns',
        'sync_user_from_auth'
      ])
      and p.prosecdef
      and exists (
        select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'
      )),
  7::bigint,
  'security definer helpers pin search_path'
);

-- 5. G4: realtime publication does not include address or email.
select set_eq(
  $$select a.attname::text
      from pg_publication p
      join pg_publication_rel pr on pr.prpubid = p.oid
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum = any (pr.prattrs)
     where p.pubname = 'supabase_realtime'
       and n.nspname = 'public'
       and c.relname = 'users'$$,
  $$values ('id'::text), ('is_verified_as_resident'::text)$$,
  'realtime users payload is only id and the verification flag'
);

insert into public.communities (id, name, invite_code, settings) values
  ('00000000-0000-0000-0000-00000000aaaa','A','CODE-A','{"secret":true}'::jsonb),
  ('00000000-0000-0000-0000-00000000bbbb','B','CODE-B','{}'::jsonb);
update public.users
   set community_id = '00000000-0000-0000-0000-00000000aaaa',
       community_role = 'committee'
 where id = '00000000-0000-0000-0000-0000000000c1';
update public.users
   set community_id = '00000000-0000-0000-0000-00000000aaaa',
       visible_on_phonebook = true,
       address = 'Secret 1',
       address_visibility = 'committee',
       "firstName" = 'Ada'
 where id = '00000000-0000-0000-0000-0000000000a1';
update public.users
   set community_id = '00000000-0000-0000-0000-00000000aaaa',
       "firstName" = 'Bea'
 where id = '00000000-0000-0000-0000-0000000000a2';
update public.users
   set community_id = '00000000-0000-0000-0000-00000000aaaa',
       community_role = 'resident',
       "firstName" = 'Cora'
 where id = '00000000-0000-0000-0000-0000000000a3';
update public.users
   set community_id = '00000000-0000-0000-0000-00000000bbbb'
 where id = '00000000-0000-0000-0000-0000000000b1';
insert into public.user_communities (user_id, community_id, role) values
  ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-00000000aaaa','committee'),
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000aaaa','resident'),
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-00000000aaaa','resident'),
  ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-00000000aaaa','resident'),
  ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-00000000bbbb','resident'),
  ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-00000000bbbb','resident');
insert into public.businesses (id, community_id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-00000000aaaa','00000000-0000-0000-0000-0000000000a2','Shop');
insert into public.important_notifications (community_id, title, body) values
  ('00000000-0000-0000-0000-00000000aaaa','A note','hello'),
  ('00000000-0000-0000-0000-00000000bbbb','B note','hello');
insert into public.transport_schedules (community_id, title, departure_time) values
  ('00000000-0000-0000-0000-00000000aaaa','A bus','08:00'),
  ('00000000-0000-0000-0000-00000000bbbb','B bus','09:00');

-- ── anon ──
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select invite_code from public.communities$$, '42501', null, 'anon cannot read communities or invite codes');
select throws_ok($$select 1 from public.users$$, '42501', null, 'anon has no users grant');
select throws_ok($$select * from public.get_phonebook()$$, '42501', null, 'anon cannot execute get_phonebook');
select throws_ok($$select public.join_community_by_name('A')$$, '42501', null, 'anon cannot execute join_community_by_name');
select throws_ok($$truncate public.communities$$, '42501', null, 'anon cannot truncate');

-- ── resident R2 of A ──
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);

select is((select count(*) from public.users where id <> auth.uid()), 0::bigint, 'resident sees no other users rows directly');
select is((select email from public.users where id = auth.uid()), 'r2@test', 'resident can read their own profile');
select is((select count(*) from public.get_phonebook() where id = '00000000-0000-0000-0000-0000000000a1'), 1::bigint, 'phonebook lists an opted-in neighbour');
select is((select address from public.get_phonebook() where id = '00000000-0000-0000-0000-0000000000a1'), null, 'resident does not get a committee-only address');
select is((select count(*) from public.get_phonebook() where community_id = '00000000-0000-0000-0000-00000000bbbb'), 0::bigint, 'phonebook never leaks community B');
select throws_ok($$select invite_code from public.communities$$, '42501', null, 'authenticated cannot read invite_code');
select throws_ok($$select settings from public.communities$$, '42501', null, 'authenticated cannot read community settings');
select is((select name from public.communities where id = '00000000-0000-0000-0000-00000000aaaa'), 'A', 'signed-in users can read community names');
select lives_ok($$select count(*) from public.user_communities$$, 'user_communities SELECT no longer recurses');
select throws_ok(
  $$insert into public.user_communities values (auth.uid(), '00000000-0000-0000-0000-00000000bbbb', 'committee')$$,
  '42501', null, 'resident cannot forge a membership'
);
select throws_ok(
  $$update public.users set community_id = '00000000-0000-0000-0000-00000000bbbb' where id = auth.uid()$$,
  'P0001', null, 'resident cannot switch to a community they have not joined'
);
select throws_ok(
  $$update public.users set community_role = 'committee' where id = auth.uid()$$,
  'P0001', null, 'resident cannot self-promote'
);
select throws_ok(
  $$update public.users set email = 'hijack@test' where id = auth.uid()$$,
  'P0001', null, 'resident cannot change identity columns'
);
select lives_ok(
  $$update public.users set phone = '0520000000' where id = auth.uid()$$,
  'resident can update their own phone'
);
select is((select phone from public.users where id = auth.uid()), '0520000000', 'own phone update persisted');
select throws_ok(
  $$insert into public.businesses (name, owner_id, community_id, is_verified_by_committee)
    values ('x', auth.uid(), '00000000-0000-0000-0000-00000000aaaa', true)$$,
  '42501', null, 'owner cannot insert a pre-verified business'
);
select throws_ok(
  $$update public.businesses set is_verified_by_committee = true where owner_id = auth.uid()$$,
  'P0001', null, 'owner cannot mark their own business verified'
);
select throws_ok(
  $$update public.businesses set community_id = '00000000-0000-0000-0000-00000000bbbb' where owner_id = auth.uid()$$,
  'P0001', null, 'owner cannot move a business to another community'
);
select is((select count(*) from public.important_notifications where community_id = '00000000-0000-0000-0000-00000000bbbb'), 0::bigint, 'no cross-community notifications');
select is((select count(*) from public.important_notifications where community_id = '00000000-0000-0000-0000-00000000aaaa'), 1::bigint, 'own-community notifications stay visible');
select is((select count(*) from public.transport_schedules where community_id = '00000000-0000-0000-0000-00000000bbbb'), 0::bigint, 'transport from another community is hidden');
select is((select count(*) from public.transport_schedules where community_id = '00000000-0000-0000-0000-00000000aaaa'), 1::bigint, 'own-community transport is visible');

-- ── committee C of A ──
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
select lives_ok(
  $$update public.users set is_verified_as_resident = true where id = '00000000-0000-0000-0000-0000000000a2'$$,
  'committee can verify a resident'
);
select is(
  (select is_verified_as_resident from public.users where id = '00000000-0000-0000-0000-0000000000a2'),
  true,
  'committee verification persisted'
);
select throws_ok(
  $$update public.users set phone = '0500000000' where id = '00000000-0000-0000-0000-0000000000a2'$$,
  'P0001', null, 'committee cannot edit a resident''s personal fields'
);
select is(
  (select address from public.get_phonebook() where id = '00000000-0000-0000-0000-0000000000a1'),
  'Secret 1',
  'committee sees a committee-only address'
);

-- ── resident R3 switches to community B; the membership role wins over the SET clause ──
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true);
select lives_ok(
  $$update public.users
       set community_id = '00000000-0000-0000-0000-00000000bbbb',
           community_role = 'committee'
     where id = auth.uid()$$,
  'member can switch to a joined community'
);
select is((select community_role from public.users where id = auth.uid()), 'resident', 'switch copies the membership role, not the requested one');
select is((select community_id from public.users where id = auth.uid()), '00000000-0000-0000-0000-00000000bbbb'::uuid, 'switch updates the active community');

-- ── new resident joins by name (onboarding RPC) ──
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);
select is((select public.join_community_by_name('A') ->> 'success'), 'true', 'join_community_by_name assigns a new resident');
select is((select community_role from public.users where id = auth.uid()), 'resident', 'join by name cannot grant committee');
select is(
  (select role from public.user_communities where user_id = auth.uid() and community_id = '00000000-0000-0000-0000-00000000aaaa'),
  'resident',
  'join by name records a resident membership'
);
select is(
  (select public.join_community_by_name('B') ->> 'error'),
  'User is already assigned to a community',
  'join by name refuses a second community'
);

select * from finish();
rollback;
