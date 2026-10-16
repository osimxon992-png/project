-- Sahifa MVP schema. All writes go through the server with the service role key;
-- RLS only opens public reads of active shops and their products.

create table sellers (
  telegram_id bigint primary key,
  name text not null,
  username text,
  created_at timestamptz not null default now()
);

create table shops (
  id uuid primary key default gen_random_uuid(),
  seller_id bigint not null unique references sellers (telegram_id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  logo_url text,
  phone text not null default '',
  instagram text not null default '',
  telegram text not null default '',
  delivery_info text not null default '',
  payment_methods text not null default '',
  plan text not null default 'pro' check (plan in ('free', 'pro')),
  paid_until timestamptz,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  name text not null,
  price integer not null check (price >= 0),
  category text not null default '',
  variants text[] not null default '{}',
  images text[] not null default '{}',
  description text not null default '',
  available boolean not null default true,
  created_at timestamptz not null default now()
);
create index products_shop_idx on products (shop_id, created_at);

create table orders (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  shop_id uuid not null references shops (id) on delete cascade,
  customer_name text not null,
  phone text not null,
  address text not null,
  comment text not null default '',
  total integer not null,
  status text not null default 'new' check (status in ('new', 'confirmed', 'delivered', 'cancelled')),
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index orders_shop_idx on orders (shop_id, created_at desc);
create index orders_ip_idx on orders (ip_hash, created_at);

create table order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  name text not null,
  variant text not null default '',
  price integer not null,
  qty integer not null check (qty > 0)
);
create index order_items_order_idx on order_items (order_id);

create table page_views (
  shop_id uuid not null references shops (id) on delete cascade,
  day date not null,
  count integer not null default 0,
  primary key (shop_id, day)
);

create function shop_is_active(s shops) returns boolean
language sql stable as $$
  select s.plan = 'free' or s.paid_until > now()
$$;

create function increment_page_view(p_shop uuid) returns void
language sql as $$
  insert into page_views (shop_id, day, count) values (p_shop, current_date, 1)
  on conflict (shop_id, day) do update set count = page_views.count + 1
$$;
revoke execute on function increment_page_view(uuid) from public, anon, authenticated;

alter table sellers enable row level security;
alter table shops enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table page_views enable row level security;

create policy "public read active shops" on shops
  for select to anon, authenticated using (shop_is_active(shops));

create policy "public read products of active shops" on products
  for select to anon, authenticated using (
    exists (select 1 from shops s where s.id = products.shop_id and shop_is_active(s))
  );

-- Public bucket for product images and logos (read via public URL, writes via service role only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
