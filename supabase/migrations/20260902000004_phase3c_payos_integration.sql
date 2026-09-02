alter table public.orders
  add column if not exists payos_order_code bigint,
  add column if not exists payos_payment_link_id text,
  add column if not exists payos_checkout_url text,
  add column if not exists payos_qr_code text;

create unique index if not exists idx_orders_payos_order_code
  on public.orders (payos_order_code)
  where payos_order_code is not null;

create unique index if not exists idx_orders_payos_payment_link_id
  on public.orders (payos_payment_link_id)
  where payos_payment_link_id is not null;