import { configSchema,defaultConfig,type SiteConfig } from './site-config';

export type Query = <T extends Record<string, unknown> = Record<string, unknown>>(sql:string,parameters?:unknown[])=>Promise<T[]>;
export type Runtime = { GROQ_API_KEY?:string;GROQ_MODEL?:string;SETTINGS_ENCRYPTION_KEY?:string };
const b64=(bytes:Uint8Array)=>Buffer.from(bytes).toString('base64');
const unb64=(value:string)=>new Uint8Array(Buffer.from(value,'base64'));

/** SQL operations are parameterized and shared by Neon and the isolated PostgreSQL tests. */
export function createSettingsRepository(query:Query,environment:()=>Runtime){
  async function loadSettings(){
    const [row]=await query<{value:string;revision:number;updated_at:string}>('SELECT value,revision,updated_at FROM site_settings WHERE id=$1',['main']);
    if(!row)return {config:structuredClone({...defaultConfig,ai:{...defaultConfig.ai,model:environment().GROQ_MODEL||defaultConfig.ai.model}}),revision:0,updatedAt:null};
    return {config:configSchema.parse(JSON.parse(row.value)),revision:Number(row.revision),updatedAt:row.updated_at};
  }
  async function saveSettings(config:SiteConfig,expectedRevision:number,email:string){
    const rows=await query(`WITH saved AS (
      INSERT INTO site_settings (id,value,revision,updated_at)
      SELECT 'main',$1,1,$2 WHERE $3::integer=0 OR EXISTS(SELECT 1 FROM site_settings WHERE id='main')
      ON CONFLICT(id) DO UPDATE SET value=excluded.value,revision=site_settings.revision+1,updated_at=excluded.updated_at
      WHERE site_settings.revision=$3::integer RETURNING id
    ) INSERT INTO admin_history (id,action,actor,created_at,snapshot)
      SELECT $4,'Settings updated',$5,$2,$1 FROM saved RETURNING id`,
      [JSON.stringify(config),new Date().toISOString(),expectedRevision,crypto.randomUUID(),email]);
    return rows.length===1;
  }
  async function cipherKey(){const value=environment().SETTINGS_ENCRYPTION_KEY;if(!value)throw Error('Secret encryption is not configured.');const bytes=unb64(value);if(bytes.length!==32)throw Error('Encryption key must contain 32 bytes.');return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);}
  async function groqKey(){const [row]=await query<{value:string}>('SELECT value FROM app_secrets WHERE id=$1',['groq']);if(!row)return environment().GROQ_API_KEY||'';const [iv,data]=row.value.split('.');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv)},await cipherKey(),unb64(data)));}
  async function saveGroqKey(value:string,email:string){const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},await cipherKey(),new TextEncoder().encode(value));await query(`WITH saved AS (
    INSERT INTO app_secrets (id,value,updated_at) VALUES ('groq',$1,$2)
    ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at RETURNING id
    ) INSERT INTO admin_history(id,action,actor,created_at,snapshot) SELECT $3,'Groq connection updated',$4,$2,NULL FROM saved`,
    [`${b64(iv)}.${b64(new Uint8Array(encrypted))}`,new Date().toISOString(),crypto.randomUUID(),email]);}
  async function connectionStatus(){const [row]=await query<{updated_at:string}>('SELECT updated_at FROM app_secrets WHERE id=$1',['groq']);return {configured:Boolean(row||environment().GROQ_API_KEY),source:row?'Admin panel':environment().GROQ_API_KEY?'Hosting secret':'Not connected',updatedAt:row?.updated_at||null,encryptionReady:Boolean(environment().SETTINGS_ENCRYPTION_KEY)};}
  async function consumeRateLimit(identity:string,limit:number){const hash=b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity))));const minute=Math.floor(Date.now()/60000);const [row]=await query<{count:number}>(`INSERT INTO request_limits (id,minute,count) VALUES ($1,$2,1) ON CONFLICT(id,minute) DO UPDATE SET count=request_limits.count+1 RETURNING count`,[hash,minute]);await query('DELETE FROM request_limits WHERE minute<$1',[minute-2]);return Number(row?.count||0)<=limit;}
  async function recordUsage(success:boolean,latency:number,input:number,output=0){await query(`INSERT INTO daily_usage (day,requests,successes,errors,latency_ms,input_characters,output_characters) VALUES ($1,1,$2,$3,$4,$5,$6)
    ON CONFLICT(day) DO UPDATE SET requests=daily_usage.requests+1,successes=daily_usage.successes+excluded.successes,errors=daily_usage.errors+excluded.errors,latency_ms=daily_usage.latency_ms+excluded.latency_ms,input_characters=daily_usage.input_characters+excluded.input_characters,output_characters=daily_usage.output_characters+excluded.output_characters`,[new Date().toISOString().slice(0,10),success?1:0,success?0:1,latency,input,output]);}
  async function overview(){const [usage,history,connection]=await Promise.all([query(`SELECT * FROM daily_usage WHERE day>=to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')-INTERVAL '29 days','YYYY-MM-DD') ORDER BY day`),query('SELECT id,action,actor,created_at,snapshot FROM admin_history ORDER BY created_at DESC LIMIT 30'),connectionStatus()]);return {usage:usage.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,key==='day'?value:Number(value)]))),history:history.map(row=>({...row,snapshot:typeof row.snapshot==='string'?JSON.parse(row.snapshot):null})),connection};}
  return {loadSettings,saveSettings,groqKey,saveGroqKey,connectionStatus,consumeRateLimit,recordUsage,overview};
}
