create extension if not exists "pgcrypto";

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text,
  event_name text not null,
  page_path text,
  page_title text,
  referrer text,
  device_type text,
  user_agent text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  template_id text,
  website_id uuid references public.websites(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_visitor_id on public.analytics_events(visitor_id);
create index if not exists idx_analytics_events_event_name on public.analytics_events(event_name);
create index if not exists idx_analytics_events_page_path on public.analytics_events(page_path);
create index if not exists idx_analytics_events_template_id on public.analytics_events(template_id);
create index if not exists idx_analytics_events_website_id on public.analytics_events(website_id);
