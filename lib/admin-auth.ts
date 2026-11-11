import { getChatGPTUser } from '../app/chatgpt-auth';
import { runtime } from './settings-store';
export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export function adminEmail() { return runtime().ADMIN_EMAIL?.trim().toLowerCase() || 'ss7233563@gmail.com'; }
export async function authorizeAdmin() { const user = await getChatGPTUser(); if (!user)
    return { response: json({ error: 'Sign in to access the admin panel.' }, 401) }; if (user.email.trim().toLowerCase() !== adminEmail())
    return { response: json({ error: 'This account does not have admin access.' }, 403) }; return { user }; }
export function sameOrigin(request: Request) { return request.headers.get('origin') === new URL(request.url).origin; }
export async function readBody(request: Request, max = 200000) { if (Number(request.headers.get('content-length')) > max)
    throw new Error('Request is too large.'); const reader = request.body?.getReader(); if (!reader)
    throw new Error('Request body required.'); let size = 0; const chunks: Uint8Array[] = []; while (true) {
    const { done, value } = await reader.read();
    if (done)
        break;
    size += value.length;
    if (size > max) {
        await reader.cancel();
        throw new Error('Request is too large.');
    }
    chunks.push(value);
} const all = new Uint8Array(size); let offset = 0; for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
} return JSON.parse(new TextDecoder().decode(all)); }
