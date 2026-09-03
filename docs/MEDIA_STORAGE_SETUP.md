# Media Storage Setup

The builder uploads media directly to Supabase Storage using short-lived signed upload URLs. The service-role key stays in the server-side Vercel function and is never sent to the browser.

## One-time Supabase setup

Create a Storage bucket named `luu-but-media` in the Supabase Dashboard:

1. Open **Storage** and choose **New bucket**.
2. Set the name to `luu-but-media`.
3. Set the bucket to **Public**. Preview records store public media URLs in the existing `websites` and `photos` fields.

The repository does not provision this bucket automatically. Do not add the service-role key to frontend code.

## Vercel environment variables

The existing server variables remain required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optionally set `SUPABASE_STORAGE_BUCKET=luu-but-media`; the API defaults to that name when the variable is omitted.

## Upload lifecycle

Files are stored under `drafts/<upload-session>/<unique-file>`. There is currently no cleanup job for abandoned draft uploads. A later retention policy should remove unreferenced objects after an appropriate period.