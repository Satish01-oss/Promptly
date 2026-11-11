import {after,before,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createSettingsRepository,type Query} from '../lib/settings-repository';
import {defaultConfig} from '../lib/site-config';
import {allowedGoogleProfile,isAdminEmail} from '../lib/admin-policy';

const db=new PGlite();
const environment={GROQ_API_KEY:'test-key-from-environment',SETTINGS_ENCRYPTION_KEY:Buffer.alloc(32,7).toString('base64')};
const query:Query=async(sql,params=[])=>{const result=await db.query(sql,params);return result.rows as never;};
const store=createSettingsRepository(query,()=>environment);
before(async()=>{await db.exec(await readFile(new URL('../db/migrations/0001_initial.sql',import.meta.url),'utf8'));});
after(async()=>{await db.close();});

test('Google sign-in requires the verified designated administrator',()=>{assert.equal(allowedGoogleProfile({email:'ss7233563@gmail.com',email_verified:true}),true);assert.equal(allowedGoogleProfile({email:'ss7233563@gmail.com',email_verified:false}),false);assert.equal(allowedGoogleProfile({email:'someone@example.com',email_verified:true}),false);assert.equal(allowedGoogleProfile({email:'ss7233563@gmail.com'}),false);assert.equal(isAdminEmail('SS7233563@gmail.com'),true);});
test('settings and history update atomically and reject stale writes',async()=>{const initial=await store.loadSettings();assert.equal(initial.revision,0);assert.equal(await store.saveSettings(defaultConfig,0,'admin@example.com'),true);const updated=structuredClone(defaultConfig);updated.site.announcement='Saved to Postgres';assert.equal(await store.saveSettings(updated,1,'admin@example.com'),true);assert.equal(await store.saveSettings(defaultConfig,1,'admin@example.com'),false);const current=await store.loadSettings();assert.equal(current.revision,2);assert.equal(current.config.site.announcement,'Saved to Postgres');const rows=await query('SELECT * FROM admin_history');assert.equal(rows.length,2);});
test('simultaneous settings edits cannot silently overwrite each other',async()=>{const {revision}=await store.loadSettings();const results=await Promise.all([store.saveSettings(defaultConfig,revision,'first@example.com'),store.saveSettings(defaultConfig,revision,'second@example.com')]);assert.equal(results.filter(Boolean).length,1);});
test('keys are encrypted at rest and decrypt only with the right key',async()=>{assert.equal(await store.groqKey(),'test-key-from-environment');await store.saveGroqKey('a-private-test-key-for-encryption','admin@example.com');const [row]=await query<{value:string}>('SELECT value FROM app_secrets');assert.equal(row.value.includes('a-private-test-key-for-encryption'),false);assert.equal(await store.groqKey(),'a-private-test-key-for-encryption');const wrong=createSettingsRepository(query,()=>({...environment,SETTINGS_ENCRYPTION_KEY:Buffer.alloc(32,8).toString('base64')}));await assert.rejects(()=>wrong.groqKey());assert.equal((await store.connectionStatus()).source,'Admin panel');});
test('rate counters are atomic and visitor-scoped',async()=>{const results=await Promise.all(Array.from({length:8},()=>store.consumeRateLimit('visitor-one',3)));assert.equal(results.filter(Boolean).length,3);assert.equal(await store.consumeRateLimit('visitor-two',3),true);const rows=await query<{id:string}>('SELECT id FROM request_limits');assert.equal(rows.some(r=>r.id==='visitor-one'),false);});
test('usage is aggregated without storing prompt text and overview stays numeric',async()=>{await store.recordUsage(true,1100,40,200);await store.recordUsage(false,300,20);const overview=await store.overview();assert.equal(overview.usage.length,1);const day=overview.usage[0];assert.equal(day.requests,2);assert.equal(day.successes,1);assert.equal(day.errors,1);assert.equal(day.latency_ms,1400);assert.equal(day.input_characters,60);assert.equal('prompt' in day,false);assert.ok(overview.history.length>=3);});
test('migration can be rerun without destroying existing records',async()=>{await db.exec(await readFile(new URL('../db/migrations/0001_initial.sql',import.meta.url),'utf8'));assert.ok((await store.loadSettings()).revision>0);assert.equal(await store.groqKey(),'a-private-test-key-for-encryption');});
