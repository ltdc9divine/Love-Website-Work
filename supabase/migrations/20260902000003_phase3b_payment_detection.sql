alter table public.orders
  add column if not exists payment_provider text;

alter table public.orders
  add column if not exists payment_transaction_id text;

update public.orders
set payment_provider = 'bank_transfer'
where payment_provider is null;

create unique index if not exists idx_orders_transaction_code_paid
  on public.orders (transaction_code)
  where transaction_code is not null and payment_status = 'paid';

create unique index if not exists idx_orders_payment_transaction_id_paid
  on public.orders (payment_transaction_id)
  where payment_transaction_id is not null and payment_status = 'paid';

create index if not exists idx_orders_payment_provider
  on public.orders (payment_provider);
