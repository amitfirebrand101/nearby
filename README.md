# Nearby waitlist

This is a standalone, Vercel-ready landing page for Nearby. It is intentionally buildless: the static page is served from the project root and the waitlist endpoint lives in `api/waitlist.js`.

## What is included

- `index.html` — the landing page and waitlist form
- `styles.css` — responsive cream/coral/pink visual direction, dark concept-screen journey, and reduced-motion support
- `app.js` — interactive journey, practice Ping, concept-board viewer, motion controls, and validated signup
- `assets/pip.svg` — original round mascot; no heart silhouette or third-party character
- `assets/concept-*` — supplied concept boards, with WebP copies for faster page loading; original PNGs retained
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

If you already use a form/webhook service, add `WAITLIST_WEBHOOK_URL` in Vercel. The endpoint will POST the name, phone, email, reason, optional `suggestions` (when non-empty), and `submittedAt` to that URL. When this variable is present it takes precedence over Supabase.

The optional “Anything you’d love to see in Nearby?” answer is limited to 1,000 characters. With Supabase, it is appended to the existing free-text `reason` column under `Feature suggestions:`. This preserves both answers without requiring a production schema migration; submissions with no suggestions keep the original storage shape. With a webhook, it is a separate `suggestions` field.

## Test locally

Run `node tools/preview.cjs` and open `http://127.0.0.1:4173`. This loopback-only server uses the existing API adapter. Without storage environment variables it returns a configuration error, not a fake successful signup. It serves only public page files and assets, not source/configuration files.

For Vercel's full environment, use `vercel dev` after adding local environment variables.

```bash
cd nearby-waitlist
vercel dev
```

The page is designed to be usable on narrow phone screens, supports keyboard focus, includes a reduced-motion mode, and keeps the app's opt-in/privacy promises visible throughout the journey.

## Revamp notes

The supplied design boards are used directly, with CSS crops for the phone views—not reconstructed app screens. They are visibly identified as concepts. Copy distinguishes the current Android pilot from future availability, and does not advertise verified users, precise distances, extra social channels or a public store release as shipped features. Names/photos are public while discoverable; socials are shared by choice.

Pip appears in the hero, two-sided demonstration, Live Likes, journey tips, signup and confirmed-success state. The header navigation and repetitive hero were replaced with “Reach out without bothering. Break the ice.” Pings and Live Likes have distinct messaging: a Ping invites a hello; a Live Like is appreciation without asking for a conversation.

The sender/receiver demo plays once on scroll, supports replay and mode switching, and sends no network requests. It is illustrative, not an actual app delivery or notification test. Animations can be paused and respect the operating system's reduced-motion setting.

The API adds validation and storage of optional suggestions. Database schema and Vercel configuration remain unchanged; storage credentials remain server-only. No production signup was created during testing.

Run `node --test tests/*.test.cjs` for API, client-form and Ping/Like demonstration regression tests with mocked provider responses. These do not verify that your deployed Supabase/webhook credentials are configured.

### Verification — October 10, 2026

- All 20 API/client/demo regression tests passed, including optional suggestions, sending versus received states, mode-switch cancellation, replay, scroll entry and reduced-motion behavior.
- Desktop composition and full-page layout visually inspected. Mobile widths 320/390 and tablet width 768 checked; no document-level horizontal overflow after the correction.
- Journey selection, arrow-key navigation, practice-Ping response, concept-dialog open/close and empty-form validation checked in the browser.
- Hero images loaded successfully. Main concept WebP images total 475,080 bytes; supplied originals are retained for the full-board viewer.
- Signup success, duplicate-email, server-field-error and malformed-success handling checked with mocked responses. No real signup was submitted; deployed persistence has not been verified.
- Native app code, database schema and Vercel configuration untouched. This follow-up revision is local until pushed.
