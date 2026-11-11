import {readFile} from 'node:fs/promises';
import {neon} from '@neondatabase/serverless';
if(!process.env.DATABASE_URL){console.error('Set DATABASE_URL in .env.local or your deployment environment before running migrations.');process.exit(1);}
const sql=neon(process.env.DATABASE_URL);
const migration=await readFile(new URL('../db/migrations/0001_initial.sql',import.meta.url),'utf8');
const statements=migration.split(';').map(s=>s.trim()).filter(Boolean);
try{await sql.transaction(statements.map(statement=>sql.query(statement)));console.log('PostgreSQL schema ready. Existing rows preserved.');}catch{console.error('Database migration failed. Check DATABASE_URL, database access, and schema permissions.');process.exit(1);}
