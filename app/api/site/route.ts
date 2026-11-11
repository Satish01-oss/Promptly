import { loadSettings, connectionStatus } from '../../../lib/settings-store';
import { publicConfig } from '../../../lib/site-config';
import { json } from '../../../lib/admin-auth';
export async function GET() { try {
    const [{ config }, connection] = await Promise.all([loadSettings(), connectionStatus()]);
    return json({ config: publicConfig(config), configured: connection.configured });
}
catch {
    return json({ error: 'The studio settings could not be loaded. Please refresh shortly.' }, 503);
} }
