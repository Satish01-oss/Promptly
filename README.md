# Promptly

A Groq-powered prompt enhancer with a private administration panel.

Live website: https://promptly-prompt-studio-satish.majorpiece.chatgpt.site
Admin panel: https://promptly-prompt-studio-satish.majorpiece.chatgpt.site/admin
GitHub: https://github.com/Satish01-oss/Promptly

## Administration

Sign in with ChatGPT using **ss7233563@gmail.com**. The server checks this identity on every admin read and write. There is no user-management module. Website access is also controlled by Sites; the admin email has been granted visitor access.

The panel manages:
- Homepage and brand copy, prompt placeholders, footer text, and FAQs.
- Templates: add, edit, remove, and reorder; the first three appear on the homepage.
- Model, system instructions, style instructions, temperatures, output budget, and default preferences.
- Groq API key replacement, available models, and a real generation test.
- Enhancement availability, maintenance mode, demo mode, library, templates, and extension visibility.
- Input limits and per-visitor request limits, enforced on the server.
- Aggregate AI usage, success/error totals, response time, and recent activity.
- Settings export/import and history restoration. Restores become a draft for review before publishing.

Publish changes in the panel to save them to the database. No code edit or application redeployment is needed for these settings. Visitors receive the latest settings on their next page load. A stale edit from another admin session is rejected rather than silently overwriting newer settings.

The panel does not create new application features, manage hosting or domains, set GitHub credentials, or administer Groq billing. Those remain infrastructure/account operations.

## Security and data

- API keys never enter the source repository or public configuration API.
- New keys entered in the admin panel are validated with Groq, encrypted with AES-GCM, and stored in D1. Keep SETTINGS_ENCRYPTION_KEY stable: changing it requires re-entering the admin-managed key.
- ADMIN_EMAIL defaults to the designated admin. It cannot be changed through a visitor request or the admin UI.
- Usage reporting stores daily totals, not prompt text. Rate limits use short-lived hashed visitor identifiers.
- Prompt library data remains local to each browser. Disabling the library hides its UI without deleting saved data.
- Sites supplies authenticated identity headers. Do not expose the raw Worker behind a proxy that accepts visitor-supplied identity headers. Other hosting needs a real authentication integration before deployment.

## Local development

Use Node 22.13 or newer:

```powershell
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_silent_the_leader.sql
$env:SITES_LOCAL_EMAIL='ss7233563@gmail.com'
npm run dev
```

Apply the migration once to a new local database. Never replay it against an existing migrated database. Open `/admin` and use Continue with ChatGPT. The local preview simulates sign-in using SITES_LOCAL_EMAIL, only in the development server. It is not production authentication.

Use an ignored `.dev.vars` file:

```dotenv
GROQ_API_KEY=your-key
GROQ_MODEL=openai/gpt-oss-120b
ADMIN_EMAIL=ss7233563@gmail.com
SETTINGS_ENCRYPTION_KEY=base64-encoded-32-byte-random-key
```

Generate a local encryption key with:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Never commit `.dev.vars`, `.env`, or API keys. `.env.example` contains names and defaults only.

## Build and hosting

`npx tsc --noEmit` checks types. `npm run build` produces a Cloudflare Worker using Vinext. GitHub Actions runs installation, type checks, and the build on pushes and pull requests. GitHub stores the source; it does not host the server application via GitHub Pages.

The Sites manifest declares the DB binding. Sites provisions the production database and applies tracked Drizzle migrations during publication. Hosted secrets must be configured in the hosting environment, not in the manifest. Local and hosted data are separate. Repository pushes do not automatically publish to Sites.

## Extension

The browser extension remains a planned phase. Cross-origin extension API access is not enabled yet. It will need authenticated API access, selected-text capture, preview, and explicit replacement.
