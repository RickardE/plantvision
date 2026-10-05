-- Row level security: who may read and change what. Run with `pnpm test:db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

-- Test users (the profile trigger gives them their role from app metadata).
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('00000000-0000-4000-a000-000000000001', 'rls-admin@test.local', '{"role":"admin"}', '{"full_name":"RLS Admin"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000002', 'rls-designer@test.local', '{}', '{"full_name":"RLS Designer"}', 'authenticated', 'authenticated');

select is(
  (select role::text from public.profiles where id = '00000000-0000-4000-a000-000000000002'),
  'designer',
  'new users default to the designer role'
);
select is(
  (select role::text from public.profiles where id = '00000000-0000-4000-a000-000000000001'),
  'admin',
  'role comes from app metadata, which only the server can set'
);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.act_as_anon() returns void language sql as $$
  select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
$$;

-- Fixture data, created as the table owner.
insert into public.products (id, article_number, name, category_id, status)
select '00000000-0000-4000-b000-000000000001', 'RLS-1', 'RLS Active', id, 'active' from public.categories where slug = 'vaxter';
insert into public.products (id, article_number, name, category_id, status)
select '00000000-0000-4000-b000-000000000002', 'RLS-2', 'RLS Inactive', id, 'inactive' from public.categories where slug = 'vaxter';

-- Anonymous visitors see nothing.
select pg_temp.act_as_anon();
select throws_ok($$ select count(*) from public.products $$, '42501', null, 'anon cannot read products');
select throws_ok($$ select count(*) from public.projects $$, '42501', null, 'anon cannot read projects');
select throws_ok($$ select public.product_facets() $$, '42501', null, 'anon cannot call RPCs');
reset role;

-- Designers: read the catalogue, never change it.
select pg_temp.act_as('00000000-0000-4000-a000-000000000002');
select is((select count(*)::int from public.products where article_number like 'RLS-%'), 2, 'designers read products');
select is(public.is_admin(), false, 'designer is not admin');
select throws_ok(
  $$ insert into public.products (article_number, name, category_id) select 'RLS-3', 'x', id from public.categories limit 1 $$,
  '42501', null, 'designers cannot create products'
);
select is_empty(
  $$ update public.products set name = 'hacked' where article_number = 'RLS-1' returning id $$,
  'designers cannot update products'
);
select is_empty($$ delete from public.categories returning id $$, 'designers cannot delete categories');
select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '00000000-0000-4000-a000-000000000002' $$,
  '42501', null, 'designers cannot promote themselves'
);
select lives_ok(
  $$ update public.profiles set full_name = 'Renamed' where id = '00000000-0000-4000-a000-000000000002' $$,
  'users can change their own name'
);
select is_empty(
  $$ update public.profiles set full_name = 'x' where id = '00000000-0000-4000-a000-000000000001' returning id $$,
  'users cannot change someone else''s name'
);

-- Designers work on shared projects.
select lives_ok(
  $$ insert into public.projects (id, name) values ('00000000-0000-4000-c000-000000000001', 'RLS Project') $$,
  'designers create projects'
);
select lives_ok(
  $$ insert into public.designs (id, project_id, name) values ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-c000-000000000001', 'Room') $$,
  'designers create rooms'
);
select lives_ok(
  $$ insert into public.design_alternatives (id, design_id, name, position) values ('00000000-0000-4000-c000-000000000003', '00000000-0000-4000-c000-000000000002', 'A', 1) $$,
  'designers create alternatives'
);
select lives_ok(
  $$ select public.save_alternative_items('00000000-0000-4000-c000-000000000003',
       '[{"product_id":"00000000-0000-4000-b000-000000000001","product_image_id":null,"x":0.5,"y":0.5,"width":0.2,"rotation":0,"flip_x":false}]') $$,
  'designers save items'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('environment-images', '00000000-0000-4000-c000-000000000002/room.jpg') $$,
  'designers upload room photos into a design folder'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('environment-images', 'elsewhere/room.jpg') $$,
  '42501', null, 'room photos outside a design folder are rejected'
);
select is((select count(*)::int from public.design_items where alternative_id = '00000000-0000-4000-c000-000000000003'), 1, 'items were saved');
select isnt(
  public.duplicate_alternative('00000000-0000-4000-c000-000000000003', 'B'),
  null,
  'designers duplicate alternatives'
);
select is(
  (select sum(item_count)::int from (select (select count(*) from public.design_items i where i.alternative_id = a.id) as item_count
     from public.design_alternatives a where a.design_id = '00000000-0000-4000-c000-000000000002') t),
  2,
  'duplicating copies the items'
);
reset role;

-- Admins manage the catalogue and see the team's projects.
select pg_temp.act_as('00000000-0000-4000-a000-000000000001');
select is(public.is_admin(), true, 'admin is admin');
select lives_ok(
  $$ update public.products set status = 'active' where article_number = 'RLS-2' $$,
  'admins update products'
);
select is((select count(*)::int from public.projects where name = 'RLS Project'), 1, 'projects are shared with the whole team');
select throws_ok(
  $$ update public.profiles set role = 'designer' where id = '00000000-0000-4000-a000-000000000002' $$,
  '42501', null, 'roles change only through the server (service role)'
);
reset role;

select * from finish();
rollback;
