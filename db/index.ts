import { neon } from '@neondatabase/serverless';
export function getDb(){if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required.');return neon(process.env.DATABASE_URL);}
