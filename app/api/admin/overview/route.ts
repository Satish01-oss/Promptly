import { authorizeAdmin, json } from '../../../../lib/admin-auth';
import { database, connectionStatus } from '../../../../lib/settings-store';
export async function GET() { const auth = await authorizeAdmin(); if (auth.response)
    return auth.response; try {
    const db = database();
    const [usage, history, connection] = await Promise.all([db.prepare("SELECT * FROM daily_usage WHERE day >= date('now','-29 days') ORDER BY day").all(), db.prepare('SELECT id,action,actor,created_at,snapshot FROM admin_history ORDER BY created_at DESC LIMIT 30').all(), connectionStatus()]);
    return json({ usage: usage.results, history: history.results.map(row => ({ ...row, snapshot: typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : null })), connection, adminEmail: auth.user!.email });
}
catch {
    return json({ error: 'Dashboard data is unavailable.' }, 503);
} }
