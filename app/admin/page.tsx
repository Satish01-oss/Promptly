import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from '../chatgpt-auth';
import { adminEmail } from '../../lib/admin-auth';
import AdminPanel from './panel';
export const dynamic = 'force-dynamic';
export default async function AdminPage() { const user = await getChatGPTUser(); if (!user || user.email.trim().toLowerCase() !== adminEmail())
    return <main className="admin-access"><a href="/" className="brand">promptly.</a><span className="section-kicker">PRIVATE ADMINISTRATION</span><h1>{user ? 'This account is not an administrator.' : 'Your workspace, under control.'}</h1><p>Sign in with {adminEmail()} to manage Promptly. Regular visitors do not have admin access.</p><a className="enhance" href={user ? chatGPTSignOutPath('/admin') : chatGPTSignInPath('/admin')} target="_top">{user ? 'Sign out and switch account' : 'Continue with ChatGPT'}</a><a className="admin-back" href="/">Back to the studio →</a></main>; return <AdminPanel email={user.email}/>; }
