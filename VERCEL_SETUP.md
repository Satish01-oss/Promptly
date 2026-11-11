# Deploy Promptly on Vercel

## 1. Import the GitHub repository

Import `Satish01-oss/Promptly` in Vercel. Use:

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root directory | Repository root (`./`) |
| Node.js | 22.x |
| Install command | `npm ci` |
| Build command | `npm run vercel-build` |
| Output directory | Framework default; do not set `dist` |

`vercel.json` supplies these commands. Do not reuse the old Cloudflare/Vinext build command.

You can choose the final `*.vercel.app` project hostname before finishing OAuth setup. A first deployment without the required environment values stops with a list of missing variable names; add them and redeploy.

## 2. Connect Neon Postgres

In the Vercel project’s Storage/Marketplace section, connect a **new Neon Postgres database**. Link it to the intended environments. Confirm that it provides `DATABASE_URL`. Use a separate database/branch for previews if you want preview settings isolated from production.

The Vercel build validates environment variables, then runs the transactional schema initializer before building. There is no separate manual SQL step for a new database. Schema creation preserves existing rows on redeployment.

## 3. Configure Google login

In Google Cloud Console:

1. Configure the OAuth consent screen. If the app is in testing mode, add `ss7233563@gmail.com` as a test user.
2. Create an OAuth **Web application** client.
3. Add this exact authorized redirect URI, replacing the domain:

```text
https://YOUR-PROJECT.vercel.app/api/auth/callback/google
```

4. Save the client ID as `AUTH_GOOGLE_ID` and client secret as `AUTH_GOOGLE_SECRET` in Vercel.

For a custom domain, register its callback too. For previews, use a stable preview domain and register its callback; a randomly generated preview URL will not automatically be allowed by Google. `AUTH_URL`, when set, must match the environment’s own hostname, not another deployment’s domain.

Only the configured administrator’s **verified Google email** is accepted. Regular studio visitors do not log in, and the app creates no user records.

## 4. Add environment variables

Apply these to Production, and to Preview/Development only where you have the corresponding resources:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon connection string; normally supplied by the integration |
| `GROQ_API_KEY` | Your existing Groq API key |
| `AUTH_SECRET` | Random secret, at least 32 characters |
| `AUTH_GOOGLE_ID` | Google OAuth Web application client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `SETTINGS_ENCRYPTION_KEY` | Base64-encoded random 32-byte key; keep stable |
| `ADMIN_EMAIL` | `ss7233563@gmail.com` (also the default) |
| `GROQ_MODEL` | `openai/gpt-oss-120b` (optional; changeable later in admin) |
| `AUTH_URL` | Optional canonical URL, e.g. `https://YOUR-PROJECT.vercel.app` |

Generate independent values for AUTH_SECRET and SETTINGS_ENCRYPTION_KEY with these commands; save them directly to Vercel rather than source files:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

The local Desktop project’s ignored `.env.local` already preserves your Groq key and encryption key and contains a generated AUTH_SECRET. Add the missing Neon and Google credentials locally if you want local development. Do not paste private values into `.env.example` or commit `.env.local`.

## 5. Deploy and verify

Redeploy after configuring the environment:

1. Open `/` and enhance a sample prompt. It should say Powered by Groq.
2. Open `/admin` and Continue with Google as `ss7233563@gmail.com`.
3. Change a small piece of website copy and Publish changes.
4. Refresh the studio and confirm it changed.
5. Run the live Groq test in the admin panel.

Future pushes to `main` deploy through Vercel’s Git integration once the project is imported. Routine admin changes go straight to Postgres without a deployment.

If you used the previous hosted admin panel, export its settings first, then import and publish them in this new admin panel. Old database records are not automatically copied between hosting providers.

## Troubleshooting

- **Missing Vercel environment variables:** Add the named keys and redeploy. No secret values are printed in build output.
- **Database migration failed:** Confirm DATABASE_URL and Neon access. Use a fresh database for the first migration.
- **Google redirect_uri_mismatch:** Register the exact `/api/auth/callback/google` URL for the hostname you opened.
- **Access denied:** Sign in with the designated admin Google account and ensure its email is verified.
- **Setup required / settings unavailable:** Check Neon connection and deployment logs. No local-file database is used in serverless functions.
- **No model response:** Choose a text-generation model from the admin model list, publish it, then run the connection test.
