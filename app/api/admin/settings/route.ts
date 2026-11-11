import { authorizeAdmin, json, sameOrigin, readBody } from '../../../../lib/admin-auth';
import { configSchema } from '../../../../lib/site-config';
import { loadSettings, saveSettings } from '../../../../lib/settings-store';
export async function GET() { const auth = await authorizeAdmin(); if (auth.response)
    return auth.response; try {
    return json(await loadSettings());
}
catch {
    return json({ error: 'Settings are unavailable.' }, 503);
} }
export async function PUT(request: Request) { const auth = await authorizeAdmin(); if (auth.response)
    return auth.response; if (!sameOrigin(request))
    return json({ error: 'Invalid request origin.' }, 403); try {
    const body = await readBody(request);
    const parsed = configSchema.safeParse(body.config);
    if (!parsed.success)
        return json({ error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).slice(0, 5).join('; ') }, 400);
    if (!Number.isInteger(body.revision) || body.revision < 0)
        return json({ error: 'Invalid settings revision.' }, 400);
    if (!await saveSettings(parsed.data, body.revision, auth.user!.email))
        return json({ error: 'Settings changed in another session. Reload before saving to avoid overwriting those changes.' }, 409);
    return json(await loadSettings());
}
catch {
    return json({ error: 'Could not save settings. Check your input and try again.' }, 400);
} }
