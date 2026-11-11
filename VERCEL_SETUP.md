# Vercel setup — Groq only

1. Import `Satish01-oss/Promptly` with Framework **Next.js** and repository root `./`.
2. Use Node **22.x**, install command `npm ci`, build command `npm run vercel-build`, and the framework-default output directory. `vercel.json` configures the commands.
3. Add `GROQ_API_KEY` under Project → Settings → Environment Variables for Production.
4. Optionally set `GROQ_MODEL=openai/gpt-oss-120b`.
5. Redeploy the latest `main` commit.

No Neon database or Google OAuth credentials are needed. DATABASE_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET, SETTINGS_ENCRYPTION_KEY, and AUTH_URL are ignored by this temporary version and may be removed from the Vercel project.

The studio uses built-in templates and website settings. The prompt library remains in each visitor’s browser. Admin access, server-side settings editing, key editing, settings history, and usage reporting are paused. `/admin` and all admin API endpoints remain closed until authentication and persistent storage are restored.

The local Desktop project’s `.env.local` preserves the Groq key. Private files remain ignored by Git. The old database records are not deleted, and the old deployment is separate from this source update.

If deployment fails, check that the new commit was selected and GROQ_API_KEY is set for the target environment. The build no longer runs migrations or checks OAuth variables.
