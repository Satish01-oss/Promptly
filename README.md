# Promptly

A Groq-powered prompt studio built with standard Next.js App Router, ready for Vercel.

- Public studio with editable results, templates, styles, tone controls, and a browser-local library.
- Private `/admin` panel for site copy, FAQs, templates, model settings, AI instructions, feature switches, maintenance, limits, usage, and settings history.
- Google sign-in restricted to the verified account `ss7233563@gmail.com` by default. There is no user-management UI or user database.
- Neon Postgres stores settings, encrypted keys, history, rate counters, and aggregate metrics.

**Deployment instructions: [VERCEL_SETUP.md](VERCEL_SETUP.md).**

## Commands

Use Node 22.13 or newer.

```powershell
npm ci
npm run typecheck
npm test
npm run build
```

The normal production build needs no live database or OAuth credentials. It builds the UI and server handlers, while the isolated PostgreSQL and deployment tests verify database behavior and the admin identity policy.

For a working local server, copy `.env.example` to `.env.local`, fill its values, then run:

```powershell
npm run db:migrate
npm run dev
```

Configure Google’s development callback as `http://localhost:3000/api/auth/callback/google`. `npm start` runs the built production server. Local `.env.local` and legacy `.dev.vars` are ignored by Git. Next.js reads `.env.local`; it does not read `.dev.vars`.

## Administration

Open `/admin` and Continue with Google using the designated admin account. The server verifies the signed session and allowlisted email on every admin API request. Visitors cannot become administrators by setting headers, browser storage, or cookies themselves.

Publish changes in the panel to save them. No source edit or redeployment is needed for the supported settings. Visitors receive the latest settings on the next page load. Stale writes from another session are rejected. Imports and restores become drafts for review before publication.

Admin-managed Groq keys are validated, encrypted with AES-GCM, and stored in Postgres. Keep `SETTINGS_ENCRYPTION_KEY` stable. Exports and API responses never include keys. Usage metrics store totals, not prompt text. Rate counters use short-lived hashed visitor IP identifiers from Vercel’s proxy.

## Storage and migration

`db/migrations/0001_initial.sql` creates the PostgreSQL schema. `npm run db:migrate` applies it transactionally and preserves existing rows when rerun. It runs automatically in the Vercel build after environment checks. Standard CI uses `npm run build` and isolated tests, so it never touches your production database.

The `drizzle/` folder is historical Cloudflare SQLite migration metadata and is not used by Vercel. New PostgreSQL schema changes belong in `db/migrations/`; `db/schema.ts` documents the PostgreSQL tables. No Cloudflare bindings, Worker runtime, ChatGPT authentication headers, or Vinext tooling are required.

This migration changes the source repository for Vercel. The previously published Sites website is a separate deployment. Its saved database records are not automatically moved: export settings from its admin panel and import them into the Vercel admin panel if needed. API keys must be set in Vercel or entered again in the new admin panel.

## Scope

The panel covers everyday product configuration. Infrastructure, domains, Google OAuth, database provisioning, GitHub access, and provider billing stay in their own dashboards. The browser extension remains a planned phase; cross-origin extension API access is not enabled.
