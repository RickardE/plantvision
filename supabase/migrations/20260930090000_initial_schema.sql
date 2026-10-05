-- PlantVision initial schema: product library (phase 1) and designs/visualizations (phase 2).
-- Authorisation lives here, in Row Level Security. The application never relies on its own
-- checks for security; they only exist to give friendly error messages.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'designer');
create type public.product_status as enum ('active', 'inactive');
create type public.category_kind as enum ('plant', 'pot', 'accessory', 'other');
create type public.light_requirement as enum ('low', 'medium', 'high');
create type public.visualization_status as enum ('pending', 'succeeded', 'failed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '' check (char_length(full_name) <= 120),
  role public.app_role not null default 'designer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role comes from app_metadata (only settable with the service role), never user_metadata.
create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'designer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Phase 1: product library
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 80),
  kind public.category_kind not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  article_number text not null unique check (char_length(article_number) between 1 and 64),
  name text not null check (char_length(name) between 1 and 200),
  botanical_name text check (char_length(botanical_name) <= 200),
  description text check (char_length(description) <= 4000),
  supplier text check (char_length(supplier) <= 120),
  status public.product_status not null default 'active',
  width_cm numeric(7, 1) check (width_cm > 0),
  depth_cm numeric(7, 1) check (depth_cm > 0),
  height_cm numeric(7, 1) check (height_cm > 0),
  size_label text check (char_length(size_label) <= 120),
  color text check (char_length(color) <= 200),
  light_requirement public.light_requirement,
  price_sek numeric(12, 2) check (price_sek >= 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  search_text text generated always as (
    lower(
      name || ' ' || article_number || ' ' || coalesce(botanical_name, '') || ' '
      || coalesce(color, '') || ' ' || coalesce(supplier, '')
    )
  ) stored,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_height_idx on public.products (height_cm);
create index products_search_trgm_idx on public.products using gin (search_text extensions.gin_trgm_ops);
create index products_name_idx on public.products (name);

create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text,
  external_url text check (external_url ~ '^https://'),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_images_one_source check (num_nonnulls(storage_path, external_url) = 1)
);

create index product_images_product_idx on public.product_images (product_id, position);

-- ---------------------------------------------------------------------------
-- Phase 2: designs and visualizations
-- ---------------------------------------------------------------------------

-- A customer project groups the rooms ("designs") made for one customer.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  customer_name text check (char_length(customer_name) <= 160),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- A design is one customer/environment image (a room) that alternatives are composed on.
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  environment_image_path text,
  image_width integer check (image_width > 0),
  image_height integer check (image_height > 0),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint designs_image_complete check (
    (environment_image_path is null and image_width is null and image_height is null)
    or (environment_image_path is not null and image_width is not null and image_height is not null)
  )
);

create index designs_project_idx on public.designs (project_id);

create trigger designs_set_updated_at before update on public.designs
  for each row execute function public.set_updated_at();

create table public.design_alternatives (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index design_alternatives_design_idx on public.design_alternatives (design_id, position);

create trigger design_alternatives_set_updated_at before update on public.design_alternatives
  for each row execute function public.set_updated_at();

-- Placement is stored relative to the environment image: x/y are the item's centre and width
-- its width, all as fractions of the image width/height. Height follows the product image's
-- aspect ratio. Rotation is in degrees, clockwise.
create table public.design_items (
  id uuid primary key default gen_random_uuid(),
  alternative_id uuid not null references public.design_alternatives (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_image_id uuid references public.product_images (id) on delete set null,
  x double precision not null check (x between -1 and 2),
  y double precision not null check (y between -1 and 2),
  width double precision not null check (width > 0 and width <= 4),
  rotation double precision not null default 0 check (rotation between -360 and 360),
  flip_x boolean not null default false,
  z_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index design_items_alternative_idx on public.design_items (alternative_id, z_index);
create index design_items_product_idx on public.design_items (product_id);

create table public.visualizations (
  id uuid primary key default gen_random_uuid(),
  alternative_id uuid not null references public.design_alternatives (id) on delete cascade,
  status public.visualization_status not null default 'pending',
  -- The room image the visualization was generated from (kept even if the design's image changes).
  environment_image_path text not null,
  instructions text check (char_length(instructions) <= 1000),
  prompt text,
  composite_path text,
  result_path text,
  provider text,
  model text,
  error text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint visualizations_result_when_done check (status <> 'succeeded' or result_path is not null)
);

create index visualizations_alternative_idx on public.visualizations (alternative_id, created_at desc);

-- Keep "recently changed" ordering meaningful: editing an alternative touches its design,
-- and changing a design touches its project.
create function public.touch_parent_design() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.designs set updated_at = now() where id = coalesce(new.design_id, old.design_id);
  return null;
end;
$$;

create trigger design_alternatives_touch_design after insert or update or delete on public.design_alternatives
  for each row execute function public.touch_parent_design();

create function public.touch_parent_project() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.projects set updated_at = now() where id = coalesce(new.project_id, old.project_id);
  return null;
end;
$$;

create trigger designs_touch_project after insert or update or delete on public.designs
  for each row execute function public.touch_parent_project();

-- List views with counts. security_invoker makes them respect the caller's RLS.
create view public.design_summaries with (security_invoker = true) as
select
  d.id,
  d.project_id,
  d.name,
  d.environment_image_path,
  d.created_at,
  d.updated_at,
  (select count(*) from public.design_alternatives a where a.design_id = d.id) as alternative_count,
  (
    select count(*) from public.visualizations v
    join public.design_alternatives a on a.id = v.alternative_id
    where a.design_id = d.id and v.status = 'succeeded'
  ) as visualization_count
from public.designs d;

create view public.project_summaries with (security_invoker = true) as
select
  p.id,
  p.name,
  p.customer_name,
  p.created_at,
  p.updated_at,
  (select count(*) from public.design_summaries ds where ds.project_id = p.id) as room_count,
  (select coalesce(sum(ds.visualization_count), 0) from public.design_summaries ds where ds.project_id = p.id)::bigint
    as visualization_count,
  (
    select ds.environment_image_path from public.design_summaries ds
    where ds.project_id = p.id and ds.environment_image_path is not null
    order by ds.updated_at desc limit 1
  ) as cover_image_path
from public.projects p;

-- Replaces all items of an alternative in one transaction (used by editor autosave).
create function public.save_alternative_items(p_alternative_id uuid, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'p_items must be a JSON array';
  end if;

  -- Touch the alternative first so RLS rejects unknown or inaccessible alternatives.
  update public.design_alternatives set updated_at = now() where id = p_alternative_id;
  if not found then
    raise exception 'alternative not found' using errcode = 'P0002';
  end if;

  delete from public.design_items where alternative_id = p_alternative_id;

  insert into public.design_items (
    alternative_id, product_id, product_image_id, x, y, width, rotation, flip_x, z_index
  )
  select
    p_alternative_id,
    (item ->> 'product_id')::uuid,
    nullif(item ->> 'product_image_id', '')::uuid,
    (item ->> 'x')::double precision,
    (item ->> 'y')::double precision,
    (item ->> 'width')::double precision,
    coalesce((item ->> 'rotation')::double precision, 0),
    coalesce((item ->> 'flip_x')::boolean, false),
    ordinality::integer
  from jsonb_array_elements(p_items) with ordinality as t(item, ordinality);
end;
$$;

-- Copies an alternative with all its items. Returns the new alternative id.
create function public.duplicate_alternative(p_alternative_id uuid, p_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source public.design_alternatives;
  v_new_id uuid;
begin
  select * into v_source from public.design_alternatives where id = p_alternative_id;
  if not found then
    raise exception 'alternative not found' using errcode = 'P0002';
  end if;

  insert into public.design_alternatives (design_id, name, position)
  values (
    v_source.design_id,
    p_name,
    (select coalesce(max(position), 0) + 1 from public.design_alternatives where design_id = v_source.design_id)
  )
  returning id into v_new_id;

  insert into public.design_items (
    alternative_id, product_id, product_image_id, x, y, width, rotation, flip_x, z_index
  )
  select v_new_id, product_id, product_image_id, x, y, width, rotation, flip_x, z_index
  from public.design_items where alternative_id = p_alternative_id;

  return v_new_id;
end;
$$;

-- Distinct filter values for the product library (colours and suppliers of active products).
create function public.product_facets()
returns table (facet text, value text, product_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select 'color', color, count(*) from public.products
  where status = 'active' and color is not null group by color
  union all
  select 'supplier', supplier, count(*) from public.products
  where status = 'active' and supplier is not null group by supplier
  order by 1, 3 desc, 2;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.projects enable row level security;
alter table public.designs enable row level security;
alter table public.design_alternatives enable row level security;
alter table public.design_items enable row level security;
alter table public.visualizations enable row level security;

-- Nothing is available without signing in.
revoke all on all tables in schema public from anon;
grant select on public.design_summaries, public.project_summaries to authenticated;
revoke execute on all functions in schema public from anon, public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.save_alternative_items(uuid, jsonb) to authenticated;
grant execute on function public.duplicate_alternative(uuid, text) to authenticated;
grant execute on function public.product_facets() to authenticated;

-- Profiles: the team can see each other; users may only change their own name.
-- Role changes go through the service role in the admin user actions.
create policy "profiles are visible to signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "users update their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Product library: readable by the team, writable by admins.
create policy "categories are readable" on public.categories
  for select to authenticated using (true);
create policy "admins manage categories" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products are readable" on public.products
  for select to authenticated using (true);
create policy "admins manage products" on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product images are readable" on public.product_images
  for select to authenticated using (true);
create policy "admins manage product images" on public.product_images
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Design work is shared by the whole team.
create policy "team manages projects" on public.projects
  for all to authenticated using (true) with check (true);
create policy "team manages designs" on public.designs
  for all to authenticated using (true) with check (true);
create policy "team manages alternatives" on public.design_alternatives
  for all to authenticated using (true) with check (true);
create policy "team manages design items" on public.design_items
  for all to authenticated using (true) with check (true);
create policy "team manages visualizations" on public.visualizations
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('environment-images', 'environment-images', false, 20971520, array['image/jpeg', 'image/png', 'image/webp']),
  ('visualizations', 'visualizations', false, 20971520, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admins write product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admins update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admins delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "team reads design media" on storage.objects
  for select to authenticated using (bucket_id in ('environment-images', 'visualizations'));
-- Room photos go into a folder named after an existing design: `<design id>/<file>`.
create policy "team uploads environment images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'environment-images'
    and exists (select 1 from public.designs d where d.id::text = (storage.foldername(objects.name))[1])
  );
create policy "team deletes design media" on storage.objects
  for delete to authenticated using (bucket_id in ('environment-images', 'visualizations'));

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

insert into public.categories (slug, name, kind, sort_order) values
  ('vaxter', 'Växter', 'plant', 10),
  ('krukor', 'Krukor', 'pot', 20),
  ('innerkrukor', 'Innerkrukor', 'accessory', 30),
  ('tillbehor', 'Tillbehör', 'accessory', 40),
  ('konstvaxter-mossa', 'Konstväxter & mossa', 'other', 50);
