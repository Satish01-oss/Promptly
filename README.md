# Promptly

A responsive prompt studio with a server-only Groq integration and a planned browser extension.

## Website
- Prompt editor, Balanced / Creative / Precise styles, tone and detail preferences.
- Editable results, copy, templates, and a browser-local saved library.
- Explicit demo mode uses a deterministic local template, not an AI model.

## Run
Use Node 22.13+. Run `npm run install:ci`, then `npm run dev`.
For local Groq calls, create an ignored `.dev.vars` with `GROQ_API_KEY=your-key`.
Set hosted runtime secrets through Sites environment settings. `GROQ_MODEL` is optional.
Refresh after configuration and select Groq AI in Preferences.
Check with `npx tsc --noEmit` and `npm run build`.

## API
GET /api/enhance returns { configured: boolean }.
POST /api/enhance accepts { prompt, mode, tone, detail } and returns { result }.
Requests are same-origin; cross-origin extension access is not enabled yet.
Groq receives the prompt only when Groq mode is selected and Enhance is pressed.
The API key stays on the server. Saved prompts stay in this browser.

## Roadmap
1. Validate the website and rewrite quality using a real Groq key.
2. Add authenticated, rate-limited API access before a public release.
3. Build a Chrome Manifest V3 extension with selected-text capture, preview, and explicit replacement.
4. Add opt-in site permissions, shared presets, and optional library sync.

The extension is planned and is not part of this first website build.
