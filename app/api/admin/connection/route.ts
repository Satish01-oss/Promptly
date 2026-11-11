import { authorizeAdmin, json, sameOrigin, readBody } from '../../../../lib/admin-auth';
import { connectionStatus, groqKey, saveGroqKey, loadSettings } from '../../../../lib/settings-store';
export async function GET() { const auth = await authorizeAdmin(); if (auth.response)
    return auth.response; try {
    const key = await groqKey();
    if (!key)
        return json({ error: 'Connect a Groq API key first.' }, 400);
    const response = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok)
        return json({ error: 'Could not retrieve models from Groq.' }, 502);
    const data = await response.json() as {
        data: {
            id: string;
        }[];
    };
    return json({ models: data.data.map(m => m.id).sort() });
}
catch {
    return json({ error: 'Groq is not reachable right now.' }, 502);
} }
export async function POST(request: Request) {
    const auth = await authorizeAdmin();
    if (auth.response)
        return auth.response;
    if (!sameOrigin(request))
        return json({ error: 'Invalid request origin.' }, 403);
    try {
        const body = await readBody(request, 2000);
        if (!['save', 'test'].includes(body.action))
            return json({ error: 'Unknown connection action.' }, 400);
        if (body.action === 'save' && (typeof body.key !== 'string' || body.key.length < 20 || body.key.length > 500 || /\s/.test(body.key)))
            return json({ error: 'Enter a valid Groq API key.' }, 400);
        const key = body.action === 'save' ? body.key : await groqKey();
        if (!key)
            return json({ error: 'No Groq API key is connected.' }, 400);
        const response = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
        if (!response.ok)
            return json({ error: response.status === 401 ? 'Groq rejected this API key.' : 'Groq could not validate this connection.' }, 400);
        if (body.action === 'save')
            await saveGroqKey(key, auth.user!.email);
        else {
            const { config } = await loadSettings();
            const test = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000), body: JSON.stringify({ model: config.ai.model, max_completion_tokens: 1200, messages: [{ role: 'system', content: 'Rewrite the user request as a clear prompt. Return only the prompt.' }, { role: 'user', content: 'Write a product launch email.' }] }) });
            if (!test.ok)
                return json({ error: 'The API key works, but the selected model could not generate a response. Choose an available text model in AI settings.' }, 400);
            const data = await test.json() as {
                choices?: {
                    message?: {
                        content?: string;
                    };
                }[];
            };
            if (!data.choices?.[0]?.message?.content)
                return json({ error: 'The selected model returned an empty response.' }, 502);
        }
        return json({ message: body.action === 'save' ? 'Connection validated and saved securely.' : 'Live generation test passed.', connection: await connectionStatus() });
    }
    catch {
        return json({ error: 'Could not complete the connection request. Please try again.' }, 502);
    }
}
