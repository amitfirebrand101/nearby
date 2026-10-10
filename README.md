# Nearby waitlist

This is a standalone, Vercel-ready landing page for Nearby. It is intentionally buildless: the static page is served from the project root and the waitlist endpoint lives in `api/waitlist.js`.

## What is included

- `index.html` — the landing page and waitlist form
- `styles.css` — responsive dark, editorial UI
- `app.js` — client-side validation, submit state, and success state
- `api/waitlist.js` — server-side validation and persistence adapter
- `supabase.sql` — one-time database table setup
- `vercel.json` — clean URLs and basic security headers

## Deploy with Supabase (recommended)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste in `supabase.sql`, and run it.
3. Create a Vercel project from this folder. If the repository contains other folders, set the Vercel **Root Directory** to `nearby-waitlist`.
4. Add these Vercel environment variables for Production (and Preview if you want to test there):

   - `SUPABASE_URL` — the project URL, for example `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` — the server-only service role key from Supabase

5. Deploy. Never put the service role key in `index.html`, `app.js`, or any `NEXT_PUBLIC_` variable.

The form will show a clear configuration message until the environment variables exist. The API only returns a generic provider error to browsers and does not log submitted personal details.

## Deploy with a webhook instead

If you already use a form/webhook service, add `WAITLIST_WEBHOOK_URL` in Vercel. The endpoint will POST the name, phone, email, reason, and `submittedAt` to that URL. When this variable is present it takes precedence over Supabase.

## Test locally

For the visual page only, open `index.html` in a browser or run any static server from this folder. The `/api/waitlist` route is provided by Vercel, so the form submission itself should be tested with `vercel dev` after adding local environment variables.

```bash
cd nearby-waitlist
vercel dev
```

The page is designed to be usable on narrow phone screens, supports keyboard focus, includes a reduced-motion mode, and keeps the app's opt-in/privacy promises visible throughout the journey.
