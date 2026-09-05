-- Phase 5C-1: Database ownership foundation
-- Option D — hybrid capability-token ownership model.
-- STRICTLY ADDITIVE: new tables, nullable ownership columns, indexes only.
-- No data backfill. No RLS. No application behavior change.
-- Existing migrations are NOT modified. Existing rows keep customer_id = NULL.

-- pgcrypto is already provisioned by 20260902000000_phase2a.sql;
-- re-asserting keeps this migration independently runnable on fresh databases.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- A. customers
-- No credentials are stored here. This is the ownership anchor for the
-- anonymous commerce flow; management capability tokens reference it.
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- ---------------------------------------------------------------------------
-- B. customer_access_tokens
-- Store ONLY the SHA-256 hash of a management capability token.
-- No plaintext token column exists and none may be added.
-- Deleting a customer cascades to their (worthless) token hashes only.
-- ---------------------------------------------------------------------------
create table if not exists public.customer_access_tokens (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists idx_customer_access_tokens_customer_id
  on public.customer_access_tokens (customer_id);

-- ---------------------------------------------------------------------------
-- C/D. Ownership columns on websites and orders.
-- Nullable by design: existing production websites/orders have no owner yet.
-- No backfill: ownership must never be guessed.
-- FK action RESTRICT: deleting a customer must never silently delete
-- valuable customer content (websites) or the orders lifecycle.
-- The future source of truth for orders remains
-- orders.website_id -> websites.customer_id; the denormalized
-- orders.customer_id exists only for efficient authorization queries.
-- ---------------------------------------------------------------------------
alter table public.websites
  add column if not exists customer_id uuid references public.customers(id) on delete restrict;

alter table public.orders
  add column if not exists customer_id uuid references public.customers(id) on delete restrict;

create index if not exists idx_websites_customer_id
  on public.websites (customer_id);

create index if not exists idx_orders_customer_id
  on public.orders (customer_id);

-- ---------------------------------------------------------------------------
-- E. Pending-order uniqueness (concurrency safety for order creation).
-- Prevents concurrent duplicate pending orders for the same
-- (website_id, template_id). Payment-state semantics are unchanged:
-- one website may still hold pending orders for different templates,
-- different websites are independent, and non-pending statuses
-- (paid/failed/cancelled/manual_review) are unaffected.
-- Production-safe: if legacy data already contains duplicate pending
-- groups, this migration fails loudly with an actionable message
-- instead of silently corrupting order state.
-- ---------------------------------------------------------------------------
do $$
declare
  duplicate_group_count integer;
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'idx_orders_unique_pending_per_website_template'
  ) then
    select count(*) into duplicate_group_count
    from (
      select website_id, template_id
      from public.orders
      where payment_status = 'pending'
      group by website_id, template_id
      having count(*) > 1
    ) as duplicate_groups;

    if duplicate_group_count > 0 then
      raise exception
        'Phase 5C-1: % duplicate pending order group(s) found for (website_id, template_id). Resolve legacy duplicates before creating idx_orders_unique_pending_per_website_template.',
        duplicate_group_count;
    end if;

    create unique index idx_orders_unique_pending_per_website_template
      on public.orders (website_id, template_id)
      where payment_status = 'pending';
  end if;
end $$;