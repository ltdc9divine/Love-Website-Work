# payOS setup

## 1. Create the channel

1. Create or open the merchant channel in [my.payOS](https://my.payos.vn/).
2. Confirm the channel is active and linked to the intended MB Bank account.
3. Copy the channel's Client ID, API Key, and Checksum Key from the payOS dashboard.

## 2. Configure Vercel

Add these Production environment variables in Vercel. Enter the real values directly in Vercel; never commit them:

```text
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_ACCOUNT_NUMBER=
PAYOS_BANK_ID=
PAYOS_BANK_NAME=
PAYOS_ACCOUNT_NAME=
PAYOS_WEBHOOK_URL=https://luubutgift.vercel.app/api/payos-webhook
PAYOS_RETURN_URL=https://luubutgift.vercel.app/checkout.html
PAYOS_CANCEL_URL=https://luubutgift.vercel.app/checkout.html
```

`PAYOS_ACCOUNT_NUMBER`, `PAYOS_BANK_ID`, `PAYOS_BANK_NAME`, and `PAYOS_ACCOUNT_NAME` are public merchant display/verification values. The account number must match the payOS channel. The three key variables are server-only secrets.

## 3. Register the webhook

Register this exact URL in the payOS channel:

```text
https://luubutgift.vercel.app/api/payos-webhook
```

The webhook handler verifies the signed `data` payload with the Checksum Key before reading or updating an order.

## 4. Deploy and test

After adding the variables, deploy the application. Create one real order and confirm:

1. `POST /api/create-order` creates one pending order.
2. `POST /api/create-payment` returns the payOS checkout URL and QR payload.
3. The checkout page displays the server-created payment data.
4. A real payment causes payOS to call the webhook.
5. The matching Supabase order changes from `pending` to `paid`.
6. Repeated webhook delivery returns an idempotent success and does not create another transaction.

Do not mark an order paid from a return URL, query parameter, QR display, or browser action. The webhook/database state is authoritative.

## 5. Inspecting a payment

Use the order reference or internal order ID with `/api/payment-status`. Inspect `payment_provider`, `payment_transaction_id`, `transaction_code`, and `paid_at` in `public.orders` through Supabase. Do not log or expose API keys, checksum keys, authorization headers, or full sensitive webhook payloads.

## 6. Duplicate and error handling

The webhook checks order code, payment link, reference/description, amount, merchant account, and transaction uniqueness. A duplicate transaction is treated as idempotent. Unknown orders, wrong amounts, wrong accounts, and invalid signatures are rejected. A missing payOS configuration returns an explicit unconfigured response and never marks an order paid.