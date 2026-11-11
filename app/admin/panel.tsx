'use client';
import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowLeft, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronRight, Clock3, Copy, ExternalLink, FileText, Globe, History, KeyRound, LayoutDashboard, LoaderCircle, LogOut, Plus, RefreshCw, Save, Settings2, ShieldCheck, Sparkles, Trash2, WandSparkles, X } from 'lucide-react';
import { configSchema, defaultConfig, type SiteConfig } from '../../lib/site-config';
import './admin.css';
type Usage = {
    day: string;
    requests: number;
    successes: number;
    errors: number;
    latency_ms: number;
    input_characters: number;
    output_characters: number;
};
type Entry = {
    id: string;
    action: string;
    actor: string;
    created_at: string;
    snapshot: SiteConfig | null;
};
type Connection = {
    configured: boolean;
    source: string;
    updatedAt: string | null;
    encryptionReady: boolean;
};
type Overview = {
    usage: Usage[];
    history: Entry[];
    connection: Connection;
    adminEmail: string;
};
const sections = [{ id: 'Overview', icon: LayoutDashboard, description: 'A clear view of your studio.' }, { id: 'AI behavior', icon: WandSparkles, description: 'Shape how Promptly thinks, rewrites, and responds.' }, { id: 'Templates', icon: BookOpen, description: 'Give every idea a useful starting point.' }, { id: 'Site content', icon: Globe, description: 'Keep your website fresh, without editing code.' }, { id: 'Features & limits', icon: Settings2, description: 'Control availability and keep usage in check.' }, { id: 'Groq connection', icon: KeyRound, description: 'Manage the connection that powers your studio.' }, { id: 'Change history', icon: History, description: 'Review changes and bring back what worked.' }];
async function api<T>(url: string, options?: RequestInit): Promise<T> { const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } }); const body = await response.json() as T & {
    error?: string;
}; if (!response.ok)
    throw Error(body.error || 'The request could not be completed.'); return body; }
function Field({ label, value, onChange, multiline = false, help, type = 'text', min, max, step }: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    multiline?: boolean;
    help?: string;
    type?: string;
    min?: number;
    max?: number;
    step?: number;
}) { const id = 'field-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-'); return <label className="admin-field" htmlFor={id}><span>{label}</span>{multiline ? <textarea id={id} value={value} onChange={e => onChange(e.target.value)} rows={4}/> : <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} min={min} max={max} step={step}/>} {help && <small>{help}</small>}</label>; }
function Toggle({ title, description, value, onChange }: {
    title: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
}) { return <div className="admin-toggle-row"><div><strong>{title}</strong><p>{description}</p></div><button type="button" role="switch" aria-checked={value} aria-label={title} className={'admin-switch ' + (value ? 'on' : '')} onClick={() => onChange(!value)}><span /></button></div>; }
function date(value: string) { return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
export default function AdminPanel({ email }: {
    email: string;
}) {
    const [section, setSection] = useState('Overview');
    const [draft, setDraft] = useState<SiteConfig | null>(null), [published, setPublished] = useState<SiteConfig | null>(null), [revision, setRevision] = useState(0), [updated, setUpdated] = useState<string | null>(null);
    const [overview, setOverview] = useState<Overview | null>(null), [error, setError] = useState(''), [message, setMessage] = useState(''), [saving, setSaving] = useState(false), [loading, setLoading] = useState(true);
    const [key, setKey] = useState(''), [testing, setTesting] = useState(false), [models, setModels] = useState<string[]>([]), [modelsLoading, setModelsLoading] = useState(false);
    const dirty = Boolean(draft && published && JSON.stringify(draft) !== JSON.stringify(published));
    const refreshOverview = useCallback(async () => setOverview(await api<Overview>('/api/admin/overview')), []);
    const load = useCallback(async () => { setLoading(true); setError(''); try {
        const [settings, data] = await Promise.all([api<{
                config: SiteConfig;
                revision: number;
                updatedAt: string | null;
            }>('/api/admin/settings'), api<Overview>('/api/admin/overview')]);
        setDraft(settings.config);
        setPublished(settings.config);
        setRevision(settings.revision);
        setUpdated(settings.updatedAt);
        setOverview(data);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the admin panel.');
    }
    finally {
        setLoading(false);
    } }, []);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (dirty) {
        e.preventDefault();
        e.returnValue = '';
    } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
    useEffect(() => { if (message) {
        const timeout = setTimeout(() => setMessage(''), 6000);
        return () => clearTimeout(timeout);
    } }, [message]);
    function change(path: string, value: unknown) { setDraft(current => { if (!current)
        return current; const next = structuredClone(current); const keys = path.split('.'); let target = next as unknown as Record<string, unknown>; for (const key of keys.slice(0, -1))
        target = target[key] as Record<string, unknown>; target[keys[keys.length - 1]] = value; return next; }); }
    async function save() { if (!draft || saving)
        return; const parsed = configSchema.safeParse(draft); if (!parsed.success) {
        setError(parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).slice(0, 5).join('; '));
        return;
    } setSaving(true); setError(''); try {
        const data = await api<{
            config: SiteConfig;
            revision: number;
            updatedAt: string;
        }>('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ config: parsed.data, revision }) });
        setDraft(data.config);
        setPublished(data.config);
        setRevision(data.revision);
        setUpdated(data.updatedAt);
        setMessage('Changes published. The studio will use them on its next page load.');
        await refreshOverview();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save changes.');
    }
    finally {
        setSaving(false);
    } }
    async function connection(action: 'save' | 'test') { setTesting(true); setError(''); try {
        const data = await api<{
            message: string;
            connection: Connection;
        }>('/api/admin/connection', { method: 'POST', body: JSON.stringify({ action, ...(action === 'save' ? { key } : {}) }) });
        setKey('');
        setMessage(data.message);
        await refreshOverview();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Could not connect to Groq.');
    }
    finally {
        setTesting(false);
    } }
    async function fetchModels() { setModelsLoading(true); setError(''); try {
        setModels((await api<{
            models: string[];
        }>('/api/admin/connection')).models);
        setMessage('Available Groq models refreshed. Choose a text generation model.');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load models.');
    }
    finally {
        setModelsLoading(false);
    } }
    function exportSettings() { if (!draft)
        return; const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'promptly-settings.json'; a.click(); URL.revokeObjectURL(url); setMessage('Settings exported. API keys are never included.'); }
    async function importSettings(file?: File) { if (!file)
        return; if (file.size > 200000) {
        setError('Settings file must be smaller than 200 KB.');
        return;
    } try {
        const parsed = configSchema.parse(JSON.parse(await file.text()));
        setDraft(parsed);
        setMessage('Settings imported into your draft. Review them, then publish.');
    }
    catch {
        setError('This file is not a valid Promptly settings export.');
    } }
    const totals = (overview?.usage || []).reduce((a, d) => ({ requests: a.requests + d.requests, successes: a.successes + d.successes, errors: a.errors + d.errors, latency: a.latency + d.latency_ms }), { requests: 0, successes: 0, errors: 0, latency: 0 });
    const heading = sections.find(s => s.id === section)!;
    return <div className="admin-shell"><aside className="admin-sidebar"><a className="brand" href="/"><Sparkles size={23}/>promptly.</a><span className="admin-label">CONTROL ROOM</span><nav>{sections.map(({ id, icon: Icon }) => <button key={id} aria-current={id === section ? 'page' : undefined} className={section === id ? 'active' : ''} onClick={() => { setSection(id); setError(''); }}><Icon size={17}/>{id}{section === id && <ChevronRight size={14}/>}</button>)}</nav><div className="admin-private"><ShieldCheck size={20}/><strong>Your studio. Your controls.</strong><p>Private administration.<br />No user management.</p></div><div className="admin-account"><span>{email.slice(0, 1).toUpperCase()}</span><div><strong>Administrator</strong><small>{email}</small></div><a href="/signout-with-chatgpt?return_to=%2Fadmin" target="_top" aria-label="Sign out"><LogOut size={15}/></a></div></aside><div className="admin-main"><header className="admin-topbar"><div><span>Workspace</span><ChevronRight size={12}/><strong>Administration</strong></div><a href="/" target="_blank" rel="noreferrer">View website <ArrowUpRight size={14}/></a></header><main className="admin-content"><div className="admin-heading"><div><span className="admin-label">PROMPTLY ADMIN</span><h1>{section}</h1><p>{heading.description}</p></div><div className="admin-heading-actions"><span className={'admin-save-state ' + (dirty ? 'dirty' : '')}><i />{dirty ? 'Unpublished changes' : 'All changes saved'}</span><button className="admin-primary" disabled={!dirty || saving || loading} onClick={save}>{saving ? <LoaderCircle className="spin" size={16}/> : <Save size={16}/>} {saving ? 'Publishing…' : 'Publish changes'}</button></div></div>
    {error && <div className="admin-alert error-alert" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={17}/></button></div>}
    {message && <div className="admin-alert success-alert" role="status"><CheckCircle2 size={17}/><span>{message}</span><button onClick={() => setMessage('')} aria-label="Dismiss notification"><X size={16}/></button></div>}
    {loading ? <div className="admin-loading"><LoaderCircle className="spin" size={26}/><p>Opening your control room…</p></div> : !draft ? <div className="admin-card"><h2>The control room could not load.</h2><p>Your settings have not changed.</p><button className="admin-primary" onClick={load}>Try again</button></div> : <>
    {section === 'Overview' && <><div className="admin-welcome"><div><span className="admin-label">EVERYTHING IN ONE PLACE</span><h2>A little less code.<br /><em>A lot more control.</em></h2><p>Update your studio, fine-tune AI behavior, and keep things running smoothly.</p><button onClick={() => setSection('AI behavior')}>Fine-tune your AI <ArrowUpRight size={15}/></button></div><div className="admin-welcome-icon"><Settings2 size={52}/><Sparkles size={19}/></div></div><div className="admin-stat-grid">{[{ label: 'AI requests', value: totals.requests.toLocaleString(), hint: 'Last 30 days · UTC' }, { label: 'Success rate', value: totals.requests ? Math.round(totals.successes / totals.requests * 100) + '%' : '—', hint: totals.successes + ' successful requests' }, { label: 'Average response', value: totals.requests ? (totals.latency / totals.requests / 1000).toFixed(1) + 's' : '—', hint: 'Includes provider response time' }, { label: 'Provider errors', value: totals.errors.toLocaleString(), hint: 'Last 30 days · UTC' }].map(s => <article className="admin-stat" key={s.label}><span>{s.label}</span><strong>{s.value}</strong><small>{s.hint}</small></article>)}</div><div className="admin-two-col"><section className="admin-card"><div className="admin-card-title"><h2>Studio health</h2><Activity size={17}/></div><div className="admin-health-row"><span>Groq connection</span><b className={overview?.connection.configured ? 'status-good' : 'status-warn'}>{overview?.connection.configured ? 'Connected' : 'Setup required'}</b></div><div className="admin-health-row"><span>AI enhancement</span><b>{published?.features.enhancementEnabled ? 'Enabled' : 'Paused'}</b></div><div className="admin-health-row"><span>Maintenance mode</span><b>{published?.features.maintenance ? 'On' : 'Off'}</b></div><div className="admin-health-row"><span>Active model</span><b className="model-name">{published?.ai.model}</b></div><button className="admin-link" onClick={() => setSection('Groq connection')}>Manage connection <ArrowUpRight size={13}/></button></section><section className="admin-card"><div className="admin-card-title"><h2>Recent activity</h2><Clock3 size={17}/></div>{overview?.history.length ? overview.history.slice(0, 4).map(h => <div className="admin-activity" key={h.id}><span className="activity-dot"/><div><strong>{h.action}</strong><small>{date(h.created_at)}</small></div><Check size={13}/></div>) : <div className="admin-empty"><History size={25}/><p>Changes will appear here after your first update.</p></div>}<button className="admin-link" onClick={() => setSection('Change history')}>View all changes <ArrowUpRight size={13}/></button></section></div><section className="admin-card"><div className="admin-card-title"><h2>Request activity</h2><span>Last 30 days · no prompt text is stored</span></div>{overview?.usage.length ? <div className="usage-chart">{overview.usage.map(u => <div key={u.day} title={`${u.day}: ${u.requests} requests`}><strong>{u.requests}</strong><span style={{ height: Math.max(4, u.requests / Math.max(...overview.usage.map(x => x.requests)) * 100) + 'px' }}/><small>{u.day.slice(5)}</small></div>)}</div> : <div className="admin-empty"><Activity size={26}/><p>Your first AI enhancement will start the activity chart.</p><small>Demo requests are processed locally and are not counted.</small></div>}</section></>}
    {section === 'AI behavior' && <><section className="admin-card"><div className="admin-card-title"><div><h2>Model & generation</h2><p>Applied to every new AI enhancement after publishing.</p></div><button className="admin-secondary" disabled={modelsLoading} onClick={fetchModels}><RefreshCw size={14}/>{modelsLoading ? 'Loading…' : 'Load available models'}</button></div><Field label="Groq model ID" value={draft.ai.model} onChange={v => change('ai.model', v)} help="Use an available text generation model. Audio and guard models cannot enhance prompts."/>{models.length > 0 && <label className="admin-field"><span>Available models</span><select value={models.includes(draft.ai.model) ? draft.ai.model : ''} onChange={e => change('ai.model', e.target.value)}><option value="" disabled>Select a model</option>{models.map(m => <option key={m}>{m}</option>)}</select></label>}<div className="admin-form-grid"><Field label="Standard temperature" type="number" min={0} max={2} step={0.1} value={draft.ai.temperature} onChange={v => change('ai.temperature', Number(v))} help="Lower values keep rewrites focused."/><Field label="Creative temperature" type="number" min={0} max={2} step={0.1} value={draft.ai.creativeTemperature} onChange={v => change('ai.creativeTemperature', Number(v))}/><Field label="Maximum output tokens" type="number" min={256} max={8192} value={draft.ai.maxOutputTokens} onChange={v => change('ai.maxOutputTokens', Number(v))} help="Some reasoning models need a larger token budget."/><label className="admin-field"><span>Default tone</span><select value={draft.ai.defaultTone} onChange={e => change('ai.defaultTone', e.target.value)}>{['Professional', 'Friendly', 'Direct', 'Playful'].map(t => <option key={t}>{t}</option>)}</select></label><label className="admin-field"><span>Default detail</span><select value={draft.ai.defaultDetail} onChange={e => change('ai.defaultDetail', e.target.value)}><option>Detailed</option><option>Concise</option></select></label></div></section><section className="admin-card"><h2>Enhancement instructions</h2><p>This instruction tells the model how to rewrite prompts. It is kept on the server.</p><Field label="System prompt" value={draft.ai.systemPrompt} multiline onChange={v => change('ai.systemPrompt', v)} help="Preserve the instruction to rewrite the prompt rather than answer it."/>{(['Balanced', 'Creative', 'Precise'] as const).map(m => <Field key={m} label={m + ' style instruction'} value={draft.ai.modeInstructions[m]} multiline onChange={v => change('ai.modeInstructions.' + m, v)}/>)}</section></>}
    {section === 'Templates' && <><div className="admin-section-intro"><p>{draft.templates.length} of 40 templates. The first three appear on the homepage.</p><button className="admin-primary" disabled={draft.templates.length >= 40} onClick={() => change('templates', [...draft.templates, { id: crypto.randomUUID(), category: 'New category', title: 'New template', text: 'Describe the task you want help with.', icon: '✦' }])}><Plus size={15}/>Add template</button></div><div className="admin-template-grid">{draft.templates.map((t, i) => <section className="admin-card" key={t.id}><div className="admin-card-title"><span className="admin-template-icon">{t.icon}</span><strong>Template {i + 1}</strong><div className="admin-order"><button disabled={i === 0} aria-label={'Move template ' + (i + 1) + ' up'} onClick={() => { const list = [...draft.templates]; [list[i - 1], list[i]] = [list[i], list[i - 1]]; change('templates', list); }}>↑</button><button disabled={i === draft.templates.length - 1} aria-label={'Move template ' + (i + 1) + ' down'} onClick={() => { const list = [...draft.templates]; [list[i + 1], list[i]] = [list[i], list[i + 1]]; change('templates', list); }}>↓</button><button aria-label={'Delete template ' + (i + 1)} onClick={() => change('templates', draft.templates.filter(x => x.id !== t.id))}><Trash2 size={15}/></button></div></div><Field label={'Category ' + (i + 1)} value={t.category} onChange={v => change('templates.' + i + '.category', v)}/><Field label={'Title ' + (i + 1)} value={t.title} onChange={v => change('templates.' + i + '.title', v)}/><Field label={'Icon ' + (i + 1)} value={t.icon} onChange={v => change('templates.' + i + '.icon', v)} help="A short symbol or emoji, up to 8 characters."/><Field label={'Prompt ' + (i + 1)} value={t.text} multiline onChange={v => change('templates.' + i + '.text', v)}/></section>)}</div></>}
    {section === 'Site content' && <><section className="admin-card"><h2>Brand & homepage</h2><p>Text-only fields keep your layout safe. Publish to apply changes to the website.</p><div className="admin-form-grid">{Object.entries({ name: 'Site name', announcement: 'Announcement', headline: 'Hero headline', headlineAccent: 'Hero italic line', description: 'Hero description', inputPlaceholder: 'Prompt input placeholder', templatesHeading: 'Templates section heading', platformHeading: 'Feature section heading', platformAccent: 'Feature italic line', platformDescription: 'Feature description', closingHeading: 'Closing headline', closingAccent: 'Closing italic line', closingDescription: 'Closing description', footer: 'Footer tagline' }).map(([key, label]) => <Field key={key} label={label} value={draft.site[key as keyof SiteConfig['site']]} multiline={['description', 'inputPlaceholder', 'platformDescription'].includes(key)} onChange={v => change('site.' + key, v)}/>)}</div></section><section className="admin-card"><div className="admin-card-title"><div><h2>Frequently asked questions</h2><p>{draft.faqs.length} of 20 questions.</p></div><button className="admin-secondary" disabled={draft.faqs.length >= 20} onClick={() => change('faqs', [...draft.faqs, { q: 'New question?', a: 'Add a helpful answer.' }])}><Plus size={14}/>Add question</button></div>{draft.faqs.map((faq, i) => <div className="admin-faq-editor" key={i}><div className="admin-faq-fields"><Field label={'Question ' + (i + 1)} value={faq.q} onChange={v => change('faqs.' + i + '.q', v)}/><Field label={'Answer ' + (i + 1)} value={faq.a} multiline onChange={v => change('faqs.' + i + '.a', v)}/></div><button className="admin-icon-button" aria-label={'Delete FAQ ' + (i + 1)} onClick={() => change('faqs', draft.faqs.filter((_, index) => index !== i))}><Trash2 size={16}/></button></div>)}</section></>}
    {section === 'Features & limits' && <><section className="admin-card"><h2>Studio availability</h2><Toggle title="AI enhancement" description="Allow requests to the Groq-powered enhancement service." value={draft.features.enhancementEnabled} onChange={v => change('features.enhancementEnabled', v)}/><Toggle title="Maintenance mode" description="Pause enhancement and show a message in the studio. Admin access stays available." value={draft.features.maintenance} onChange={v => change('features.maintenance', v)}/><Field label="Maintenance message" value={draft.limits.maintenanceMessage} multiline onChange={v => change('limits.maintenanceMessage', v)}/></section><section className="admin-card"><h2>Features</h2><Toggle title="Demo mode" description="Let visitors try a local template without calling Groq." value={draft.features.demoEnabled} onChange={v => change('features.demoEnabled', v)}/><Toggle title="Prompt library" description="Show the browser-local prompt library and save controls." value={draft.features.libraryEnabled} onChange={v => change('features.libraryEnabled', v)}/><Toggle title="Templates" description="Show starter templates in the studio and navigation." value={draft.features.templatesEnabled} onChange={v => change('features.templatesEnabled', v)}/><Toggle title="Extension preview" description="Show the planned extension page and navigation link." value={draft.features.extensionVisible} onChange={v => change('features.extensionVisible', v)}/></section><section className="admin-card"><h2>Usage limits</h2><p>Limits are checked on the server, including requests made outside the UI.</p><div className="admin-form-grid"><Field label="Maximum input characters" type="number" min={100} max={12000} value={draft.limits.maxInputCharacters} onChange={v => change('limits.maxInputCharacters', Number(v))}/><Field label="Requests per visitor per minute" type="number" min={1} max={100} value={draft.limits.requestsPerMinute} onChange={v => change('limits.requestsPerMinute', Number(v))}/></div></section></>}
    {section === 'Groq connection' && <><section className="admin-connection-banner"><span className="admin-connection-icon"><KeyRound size={26}/></span><div><h2>{overview?.connection.configured ? 'Connected to Groq' : 'Connect your AI engine'}</h2><p>{overview?.connection.configured ? 'Your API key stays on the server and is never shown to visitors.' : 'Add a Groq API key to enable live prompt enhancement.'}</p></div><b className={overview?.connection.configured ? 'status-good' : 'status-warn'}>{overview?.connection.configured ? 'Connected' : 'Not connected'}</b></section><section className="admin-card"><h2>API connection</h2><div className="admin-health-row"><span>Key source</span><strong>{overview?.connection.source}</strong></div><div className="admin-health-row"><span>Last key update</span><strong>{overview?.connection.updatedAt ? date(overview.connection.updatedAt) : 'Managed by hosting'}</strong></div><div className="admin-health-row"><span>Encryption</span><strong>{overview?.connection.encryptionReady ? 'Ready · AES-GCM' : 'Requires hosting setup'}</strong></div><div className="admin-key-field"><label className="admin-field"><span>New Groq API key</span><input type="password" autoComplete="new-password" value={key} onChange={e => setKey(e.target.value)} placeholder="Paste a new key to replace the current connection"/><small>We validate the key before saving. Existing keys are never returned to the browser.</small></label><button className="admin-primary" disabled={!key || testing || !overview?.connection.encryptionReady} onClick={() => connection('save')}>{testing ? <LoaderCircle size={15} className="spin"/> : <ShieldCheck size={15}/>}Validate & save key</button></div></section><section className="admin-card"><h2>Check the full connection</h2><p>Send a small sample request using the currently published model. This uses your Groq API quota. Publish AI settings first if you changed the model.</p><button className="admin-secondary" disabled={testing || !overview?.connection.configured} onClick={() => connection('test')}>{testing ? <LoaderCircle className="spin" size={14}/> : <Activity size={14}/>}Run live generation test</button><a className="admin-inline-link" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Open Groq console <ExternalLink size={12}/></a></section></>}
    {section === 'Change history' && <><section className="admin-card"><h2>Settings backup</h2><p>Export your draft settings or import a previous export. API keys are excluded. Imports and restores become a draft until you publish.</p><div className="admin-backup-actions"><button className="admin-secondary" onClick={exportSettings}><ArrowDownToLine size={14}/>Export settings</button><label className="admin-secondary admin-upload"><FileText size={14}/>Import settings<input type="file" accept="application/json,.json" onChange={e => { importSettings(e.target.files?.[0]); e.target.value = ''; }}/></label><button className="admin-secondary" onClick={() => { setDraft(structuredClone(defaultConfig)); setMessage('Defaults loaded as a draft. Review before publishing.'); }}><RefreshCw size={14}/>Load default settings</button></div></section><section className="admin-card"><div className="admin-card-title"><div><h2>Change history</h2><p>The latest 30 changes. Restoring never overwrites history.</p></div><button className="admin-icon-button" aria-label="Refresh history" onClick={() => refreshOverview().catch(() => setError('Could not refresh history.'))}><RefreshCw size={16}/></button></div>{overview?.history.length ? overview.history.map(h => <article className="admin-history-item" key={h.id}><span className="admin-history-icon"><History size={17}/></span><div><h3>{h.action}</h3><p>{h.actor}</p><small>{date(h.created_at)}</small></div>{h.snapshot && <button className="admin-secondary" onClick={() => { setDraft(structuredClone(h.snapshot!)); setMessage('This version is loaded as a draft. Review it, then publish to restore.'); }}>Load as draft <ArrowUpRight size={12}/></button>}</article>) : <div className="admin-empty"><History size={28}/><p>No changes yet. Your first published update will appear here.</p></div>}</section></>}
    <div className="admin-bottom-note"><ShieldCheck size={13}/><span>Only {email} can manage this studio.</span><span>{updated ? 'Last published ' + date(updated) : 'Default settings · not yet customized'}</span></div>{dirty && <div className="admin-draft-bar"><span><i />You have unpublished changes.</span><div><button disabled={saving} onClick={() => { setDraft(structuredClone(published)); setMessage('Draft changes discarded.'); }}>Discard draft</button><button className="admin-primary" disabled={saving} onClick={save}><Save size={14}/>{saving ? 'Publishing…' : 'Publish changes'}</button></div></div>}</>}
  </main></div></div>;
}
