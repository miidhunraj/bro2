-- Broccoli Club: Supabase schema matching app.js
-- Safe to re-run. Does not drop existing tables or data.
create extension if not exists pgcrypto;

create table if not exists public.bc_content (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.bc_settings (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.bc_categories (
  id uuid primary key default gen_random_uuid(), name text not null,
  sort_order integer not null default 0, active boolean not null default true,
  image_url text not null default '', description text not null default '',
  created_at timestamptz not null default now()
);
-- Safe migration for existing Broccoli Club databases
alter table public.bc_categories add column if not exists image_url text not null default '';
alter table public.bc_categories add column if not exists description text not null default '';
create unique index if not exists bc_categories_name_key on public.bc_categories (lower(name));
create table if not exists public.bc_products (
  id uuid primary key default gen_random_uuid(), name text not null,
  description text not null default '', price numeric(10,2) not null default 0 check (price >= 0),
  category text not null default 'Other', image text not null default '',
  veg boolean not null default true, available boolean not null default true,
  featured boolean not null default false, sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists bc_products_cat_idx on public.bc_products(category);
create index if not exists bc_products_avail_idx on public.bc_products(available);
create table if not exists public.bc_reviews (
  id uuid primary key default gen_random_uuid(), name text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  text text not null check (length(text) between 1 and 900),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now()
);
create index if not exists bc_reviews_status_idx on public.bc_reviews(status, created_at desc);
create table if not exists public.bc_orders (
  id text primary key, type text not null default 'delivery' check (type in ('delivery','pickup')),
  customer jsonb not null default '{}'::jsonb, subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0, promo text not null default '',
  delivery_fee numeric(10,2) not null default 0, total numeric(10,2) not null default 0,
  status text not null default 'NEW' check (status in ('NEW','DONE','CANCELLED')),
  message text not null default '', created_at timestamptz not null default now()
);
create index if not exists bc_orders_status_idx on public.bc_orders(status, created_at desc);
create table if not exists public.bc_order_items (
  id uuid primary key default gen_random_uuid(), order_id text not null references public.bc_orders(id) on delete cascade,
  name text not null, qty integer not null default 1 check (qty > 0),
  price numeric(10,2) not null default 0 check (price >= 0), note text not null default ''
);
create index if not exists bc_order_items_order_idx on public.bc_order_items(order_id);
create table if not exists public.bc_pages (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null,
  body text not null default '', published boolean not null default true,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
create unique index if not exists bc_pages_slug_key on public.bc_pages(lower(slug));

-- Admin access is granted only by inserting an existing Supabase Auth user's UUID.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create or replace function public.bc_is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;
revoke all on function public.bc_is_admin() from public;
grant execute on function public.bc_is_admin() to anon, authenticated;

create or replace function public.bc_order_is_new(p_order_id text)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.bc_orders where id = p_order_id and status = 'NEW') $$;
revoke all on function public.bc_order_is_new(text) from public;
grant execute on function public.bc_order_is_new(text) to anon, authenticated;

grant select on public.bc_content, public.bc_settings, public.bc_categories, public.bc_products, public.bc_reviews, public.bc_pages to anon, authenticated;
grant insert on public.bc_reviews, public.bc_orders, public.bc_order_items to anon, authenticated;
grant select, insert, update, delete on public.bc_content, public.bc_settings, public.bc_categories, public.bc_products, public.bc_reviews, public.bc_orders, public.bc_order_items, public.bc_pages to authenticated;
grant select on public.admin_users to authenticated;

-- Drop previous policies from the supplied project, including unsafe permissive policies.
do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies
    where schemaname='public' and tablename in ('bc_content','bc_settings','bc_categories','bc_products','bc_reviews','bc_orders','bc_order_items','bc_pages','admin_users')
  loop execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename); end loop;
end $$;

alter table public.bc_content enable row level security;
alter table public.bc_settings enable row level security;
alter table public.bc_categories enable row level security;
alter table public.bc_products enable row level security;
alter table public.bc_reviews enable row level security;
alter table public.bc_orders enable row level security;
alter table public.bc_order_items enable row level security;
alter table public.bc_pages enable row level security;

create policy bc_content_public_read on public.bc_content for select to anon, authenticated using (true);
create policy bc_settings_public_read on public.bc_settings for select to anon, authenticated using (true);
create policy bc_categories_public_read on public.bc_categories for select to anon, authenticated using (active = true or public.bc_is_admin());
create policy bc_products_public_read on public.bc_products for select to anon, authenticated using (available = true or public.bc_is_admin());
create policy bc_reviews_public_read on public.bc_reviews for select to anon, authenticated using (status = 'APPROVED' or public.bc_is_admin());
create policy bc_pages_public_read on public.bc_pages for select to anon, authenticated using (published = true or public.bc_is_admin());
create policy bc_reviews_public_insert on public.bc_reviews for insert to anon, authenticated with check (status = 'PENDING' and rating between 1 and 5 and length(text) between 1 and 900);
create policy bc_orders_public_insert on public.bc_orders for insert to anon, authenticated with check (status = 'NEW' and subtotal >= 0 and discount >= 0 and delivery_fee >= 0 and total >= 0);
create policy bc_order_items_public_insert on public.bc_order_items for insert to anon, authenticated with check (public.bc_order_is_new(order_id));
create policy admin_users_read_self on public.admin_users for select to authenticated using (user_id = auth.uid());

-- Admin-only writes and private order access.
create policy bc_content_admin_all on public.bc_content for all to authenticated using (public.bc_is_admin()) with check (public.bc_is_admin());
create policy bc_settings_admin_all on public.bc_settings for all to authenticated using (public.bc_is_admin()) with check (public.bc_is_admin());
create policy bc_categories_admin_all on public.bc_categories for all to authenticated using (public.bc_is_admin()) with check (public.bc_is_admin());
create policy bc_products_admin_all on public.bc_products for all to authenticated using (public.bc_is_admin()) with check (public.bc_is_admin());
create policy bc_reviews_admin_all on public.bc_reviews for all to authenticated using (public.bc_is_admin()) with check (public.bc_is_admin());
create policy bc_orders_admin_all on public.bc_orders for all to authenticated using (public.bc_is_admin()) with check (public.bc_is_admin());
create policy bc_order_items_admin_all on public.bc_order_items for all to authenticated using (public.bc_is_admin()) with check (public.bc_is_admin());
create policy bc_pages_admin_all on public.bc_pages for all to authenticated using (public.bc_is_admin()) with check (public.bc_is_admin());

insert into public.bc_content(id,data) values (1,'{}'::jsonb) on conflict (id) do nothing;
insert into public.bc_settings(id,data) values (1,'{"whatsapp":"919000000000","currency":"₹","deliveryFee":39,"freeDeliveryOver":599,"minOrder":149,"promoCode":"CLUB10","promoPercent":10,"deliveryEta":"35-45 min","pickupEta":"20-25 min","acceptingOrders":true}'::jsonb) on conflict (id) do nothing;
