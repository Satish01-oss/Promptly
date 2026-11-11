import { env } from 'cloudflare:workers';
import { configSchema, defaultConfig, type SiteConfig } from './site-config';
type Runtime = {
    DB?: D1Database;
    GROQ_API_KEY?: string;
    GROQ_MODEL?: string;
    SETTINGS_ENCRYPTION_KEY?: string;
    ADMIN_EMAIL?: string;
};
export function runtime() { return env as Runtime; }
export function database() { const db = runtime().DB; if (!db)
    throw new Error('Settings database is unavailable.'); return db; }
export async function loadSettings(): Promise<{
    config: SiteConfig;
    revision: number;
    updatedAt: string | null;
}> {
    const row = await database().prepare('SELECT value,revision,updated_at FROM site_settings WHERE id = ?').bind('main').first<{
        value: string;
        revision: number;
        updated_at: string;
    }>();
    if (!row)
        return { config: { ...defaultConfig, ai: { ...defaultConfig.ai, model: runtime().GROQ_MODEL || defaultConfig.ai.model } }, revision: 0, updatedAt: null };
    return { config: configSchema.parse(JSON.parse(row.value)), revision: row.revision, updatedAt: row.updated_at };
}
export async function saveSettings(config: SiteConfig, expectedRevision: number, email: string) {
    const value = JSON.stringify(config);
    const now = new Date().toISOString();
    const results = await database().batch([
        database().prepare(`INSERT INTO site_settings (id,value,revision,updated_at) SELECT 'main',?,1,? WHERE ?=0 OR EXISTS(SELECT 1 FROM site_settings WHERE id='main') ON CONFLICT(id) DO UPDATE SET value=excluded.value,revision=site_settings.revision+1,updated_at=excluded.updated_at WHERE site_settings.revision=?`).bind(value, now, expectedRevision, expectedRevision),
        database().prepare(`INSERT INTO admin_history (id,action,actor,created_at,snapshot) SELECT ?,?,?,?,? WHERE changes()=1`).bind(crypto.randomUUID(), 'Settings updated', email, now, value),
    ]);
    return results[0].meta.changes > 0;
}
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
async function cipherKey() { const key = runtime().SETTINGS_ENCRYPTION_KEY; if (!key)
    throw new Error('Secret encryption is not configured.'); return crypto.subtle.importKey('raw', unb64(key), 'AES-GCM', false, ['encrypt', 'decrypt']); }
export async function groqKey() {
    const row = await database().prepare('SELECT value FROM app_secrets WHERE id=?').bind('groq').first<{
        value: string;
    }>();
    if (!row)
        return runtime().GROQ_API_KEY || '';
    const [iv, data] = row.value.split('.');
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await cipherKey(), unb64(data)));
}
export async function saveGroqKey(value: string, email: string) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await cipherKey(), new TextEncoder().encode(value));
    const now = new Date().toISOString();
    await database().batch([
        database().prepare('INSERT INTO app_secrets (id,value,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind('groq', `${b64(iv)}.${b64(new Uint8Array(ciphertext))}`, now),
        database().prepare('INSERT INTO admin_history (id,action,actor,created_at,snapshot) VALUES (?,?,?,?,NULL)').bind(crypto.randomUUID(), 'Groq connection updated', email, now),
    ]);
}
export async function connectionStatus() { const row = await database().prepare('SELECT updated_at FROM app_secrets WHERE id=?').bind('groq').first<{
    updated_at: string;
}>(); return { configured: Boolean(row || runtime().GROQ_API_KEY), source: row ? 'Admin panel' : runtime().GROQ_API_KEY ? 'Hosting secret' : 'Not connected', updatedAt: row?.updated_at || null, encryptionReady: Boolean(runtime().SETTINGS_ENCRYPTION_KEY) }; }
export async function consumeRateLimit(identity: string, limit: number) {
    const hash = b64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity))));
    const minute = Math.floor(Date.now() / 60000);
    const row = await database().prepare('INSERT INTO request_limits (id,minute,count) VALUES (?,?,1) ON CONFLICT(id,minute) DO UPDATE SET count=count+1 RETURNING count').bind(hash, minute).first<{
        count: number;
    }>();
    await database().prepare('DELETE FROM request_limits WHERE minute < ?').bind(minute - 2).run();
    return (row?.count || 0) <= limit;
}
export async function recordUsage(success: boolean, latency: number, input: number, output = 0) {
    const day = new Date().toISOString().slice(0, 10);
    await database().prepare(`INSERT INTO daily_usage (day,requests,successes,errors,latency_ms,input_characters,output_characters) VALUES (?,1,?,?,?,?,?) ON CONFLICT(day) DO UPDATE SET requests=requests+1,successes=successes+excluded.successes,errors=errors+excluded.errors,latency_ms=latency_ms+excluded.latency_ms,input_characters=input_characters+excluded.input_characters,output_characters=output_characters+excluded.output_characters`).bind(day, success ? 1 : 0, success ? 0 : 1, latency, input, output).run();
}
