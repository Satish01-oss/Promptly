# Promptly

A Groq-powered prompt studio built with Next.js, ready for Vercel.

## Deploy now

Import `Satish01-oss/Promptly` into Vercel with the Next.js preset. Add:

```dotenv
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-120b
```

Only GROQ_API_KEY is required. GROQ_MODEL is optional. The build no longer requires Neon, Google OAuth, AUTH_SECRET, or an encryption key, and runs no database migrations. See [VERCEL_SETUP.md](VERCEL_SETUP.md).

## Current functionality

The website retains the prompt editor, enhancement styles, tone/detail preferences, editable results, copy, starter templates, demo mode, and a browser-local prompt library. Groq is called only from the server. Your API key is never returned to the browser.

Website configuration uses built-in defaults. The admin panel and all admin API operations are temporarily disabled, including API-key editing and persistent usage reporting. `/admin` explains that the control room is paused. No admin route is opened without authentication. The existing admin UI and storage schema remain in source for a later restoration.

The per-minute limit is best-effort and in memory for each serverless instance. It resets on cold starts and is not a shared global quota. No prompt text or usage metrics are persisted.

## Local development

Use Node 22.x, install with `npm ci`, and put the Groq key in ignored `.env.local`:

```powershell
npm run dev
```

`npm run typecheck`, `npm test`, and `npm run build` verify the app. `npm run vercel-build` checks the Groq key before building. Next.js reads `.env.local`, not the older `.dev.vars` file. Never commit API keys or private environment files.

The database schemas and settings repository are inactive historical/future-support code. No database driver or OAuth package is installed or used at runtime. Previously deployed database records are not deleted by this change.

The browser extension remains a planned phase.
