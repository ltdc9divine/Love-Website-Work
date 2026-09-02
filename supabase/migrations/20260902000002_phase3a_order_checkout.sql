alter table public.orders
  add column if not exists order_reference text;

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'cancelled', 'manual_review'));

create unique index if not exists idx_orders_order_reference
  on public.orders (order_reference)
  where order_reference is not null;

create index if not exists idx_orders_website_template_pending
  on public.orders (website_id, template_id, payment_status);
