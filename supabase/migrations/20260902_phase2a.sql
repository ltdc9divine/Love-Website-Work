create extension if not exists "pgcrypto";

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price numeric(12,2) not null default 0,
  tier text not null default 'starter',
  category text not null default 'love',
  thumbnail_url text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  template_id uuid not null references public.templates(id) on delete restrict,
  name1 text not null default '',
  name2 text not null default '',
  start_date date,
  avatar1_url text,
  avatar2_url text,
  short_message text default '',
  love_letter text default '',
  final_message text default '',
  music_url text default '',
  custom_data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'preview', 'published', 'archived')),
  preview_token text unique,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.timeline (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  event_date date,
  title text not null default '',
  description text default '',
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete restrict,
  template_id uuid not null references public.templates(id) on delete restrict,
  amount numeric(12,2) not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'manual_review')),
  payment_method text default 'bank_transfer',
  transaction_code text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_templates_slug on public.templates(slug);
create index if not exists idx_websites_slug on public.websites(slug);
create index if not exists idx_websites_template_id on public.websites(template_id);
create index if not exists idx_websites_status on public.websites(status);
create index if not exists idx_websites_preview_token on public.websites(preview_token);
create index if not exists idx_photos_website_id on public.photos(website_id);
create index if not exists idx_timeline_website_id on public.timeline(website_id);
create index if not exists idx_orders_website_id on public.orders(website_id);
create index if not exists idx_orders_payment_status on public.orders(payment_status);

insert into public.templates (slug, name, price, tier, category, thumbnail_url, description, active)
values
  ('love-50-01', 'Love Story', 50000, 'starter', 'love', '', 'Chuyện tình của chúng mình, được kể bằng ảnh, thư và những nhịp tim.', true),
  ('love-50-02', 'Love Story 02', 50000, 'starter', 'love', '', 'Phiên bản thứ hai với bố cục khác và layout mới.', true)
on conflict (slug) do nothing;
