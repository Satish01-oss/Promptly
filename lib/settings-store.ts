import 'server-only';
import {defaultConfig,type SiteConfig} from './site-config';
const buckets=new Map<string,{minute:number;count:number}>();
export async function loadSettings(){return {config:structuredClone({...defaultConfig,ai:{...defaultConfig.ai,model:process.env.GROQ_MODEL||defaultConfig.ai.model}}),revision:0,updatedAt:null};}
export async function groqKey(){return process.env.GROQ_API_KEY||'';}
export async function connectionStatus(){return {configured:Boolean(process.env.GROQ_API_KEY),source:process.env.GROQ_API_KEY?'Hosting secret':'Not connected',updatedAt:null,encryptionReady:false};}
/** Best-effort, per-instance protection. Counters reset with serverless cold starts. */
export async function consumeRateLimit(identity:string,limit:number){const minute=Math.floor(Date.now()/60000);for(const [key,bucket] of buckets){if(bucket.minute!==minute)buckets.delete(key);}const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity))).toString('base64');if(!buckets.has(hash)&&buckets.size>=10000)return false;const bucket=buckets.get(hash)||{minute,count:0};bucket.count++;buckets.set(hash,bucket);return bucket.count<=limit;}
// No prompt text or usage metrics are persisted while storage is paused.
export async function recordUsage(_success:boolean,_latency:number,_input:number,_output=0):Promise<void>{}
export async function saveSettings(_config:SiteConfig,_revision:number,_email:string):Promise<boolean>{throw Error('Admin settings are temporarily disabled.');}
export async function saveGroqKey(_value:string,_email:string):Promise<void>{throw Error('Admin settings are temporarily disabled.');}
export async function getOverview():Promise<{usage:unknown[];history:unknown[];connection:Awaited<ReturnType<typeof connectionStatus>>}>{throw Error('Admin settings are temporarily disabled.');}
