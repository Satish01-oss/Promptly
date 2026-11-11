import 'server-only';
import { neon } from '@neondatabase/serverless';
import { createSettingsRepository,type Query } from './settings-repository';
import { defaultConfig } from './site-config';
export function runtime(){return {GROQ_API_KEY:process.env.GROQ_API_KEY,GROQ_MODEL:process.env.GROQ_MODEL,SETTINGS_ENCRYPTION_KEY:process.env.SETTINGS_ENCRYPTION_KEY};}
const query:Query=async(sql,parameters=[])=>{const url=process.env.DATABASE_URL;if(!url)throw Error('Connect a Neon database and set DATABASE_URL.');const rows=await neon(url).query(sql,parameters);return rows as never;};
const repository=createSettingsRepository(query,runtime);
export const saveSettings=repository.saveSettings;
export const groqKey=repository.groqKey;
export const saveGroqKey=repository.saveGroqKey;
export const consumeRateLimit=repository.consumeRateLimit;
export const recordUsage=repository.recordUsage;
export const getOverview=repository.overview;
export async function loadSettings(){if(!process.env.DATABASE_URL)return {config:structuredClone({...defaultConfig,ai:{...defaultConfig.ai,model:process.env.GROQ_MODEL||defaultConfig.ai.model}}),revision:0,updatedAt:null};return repository.loadSettings();}
export async function connectionStatus(){if(!process.env.DATABASE_URL)return {configured:false,source:'Database setup required',updatedAt:null,encryptionReady:Boolean(process.env.SETTINGS_ENCRYPTION_KEY)};return repository.connectionStatus();}

