import { loadSettings, groqKey, consumeRateLimit, recordUsage, connectionStatus } from '../../../lib/settings-store';
import { json, sameOrigin, readBody } from '../../../lib/admin-auth';
export async function GET() { try {
    return json({ configured: (await connectionStatus()).configured });
}
catch {
    return json({ configured: false }, 503);
} }
export async function POST(request: Request) {
    if (!sameOrigin(request))
        return json({ error: 'Please make this request from the Promptly website.' }, 403);
    const started = Date.now();
    let inputLength = 0;
    try {
        const { config } = await loadSettings();
        if (config.features.maintenance || !config.features.enhancementEnabled)
            return json({ error: config.limits.maintenanceMessage }, 503);
        let body;
        try {
            body = await readBody(request, 60000);
        }
        catch {
            return json({ error: 'Send valid JSON within the request size limit.' }, 400);
        }
        const { prompt, mode, tone, detail } = body || {};
        if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > config.limits.maxInputCharacters)
            return json({ error: `Enter a prompt between 1 and ${config.limits.maxInputCharacters.toLocaleString()} characters.` }, 400);
        if (!['Balanced', 'Creative', 'Precise'].includes(mode) || !['Professional', 'Friendly', 'Direct', 'Playful'].includes(tone) || !['Detailed', 'Concise'].includes(detail))
            return json({ error: 'Choose valid enhancement preferences.' }, 400);
        inputLength = prompt.length;
        const identity = request.headers.get('oai-authenticated-user-id') || request.headers.get('cf-connecting-ip') || 'anonymous';
        if (!await consumeRateLimit(identity, config.limits.requestsPerMinute))
            return json({ error: 'You have reached the request limit. Please wait a minute and try again.' }, 429);
        const key = await groqKey();
        if (!key)
            return json({ error: 'Groq is not connected. Please try again later or select demo mode.' }, 503);
        const style = mode as keyof typeof config.ai.modeInstructions;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000), body: JSON.stringify({ model: config.ai.model, temperature: mode === 'Creative' ? config.ai.creativeTemperature : config.ai.temperature, max_completion_tokens: config.ai.maxOutputTokens, messages: [{ role: 'system', content: `${config.ai.systemPrompt}\n\nApproach: ${config.ai.modeInstructions[style]}\nTone: ${tone}. Detail: ${detail}.` }, { role: 'user', content: prompt.trim() }] }) });
        if (!response.ok) {
            await recordUsage(false, Date.now() - started, inputLength);
            return json({ error: response.status === 429 ? 'Groq rate limit reached. Wait a moment and try again.' : response.status === 401 ? 'The AI connection needs attention. Please try again later.' : 'Groq could not complete this request. Try again shortly.' }, response.status === 429 ? 429 : 502);
        }
        const data = await response.json() as {
            choices?: {
                message?: {
                    content?: string;
                };
            }[];
        };
        const result = data.choices?.[0]?.message?.content?.trim();
        if (!result) {
            await recordUsage(false, Date.now() - started, inputLength);
            return json({ error: 'Groq returned an empty result. Please try again.' }, 502);
        }
        await recordUsage(true, Date.now() - started, inputLength, result.length);
        return json({ result });
    }
    catch {
        try {
            await recordUsage(false, Date.now() - started, inputLength);
        }
        catch { }
        return json({ error: 'The enhancement service is temporarily unavailable. Please try again.' }, 503);
    }
}
