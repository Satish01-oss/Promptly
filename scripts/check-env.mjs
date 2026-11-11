const required=['DATABASE_URL','GROQ_API_KEY','AUTH_SECRET','AUTH_GOOGLE_ID','AUTH_GOOGLE_SECRET','SETTINGS_ENCRYPTION_KEY'];
const missing=required.filter(name=>!process.env[name]?.trim());
if(missing.length){console.error('Missing Vercel environment variables: '+missing.join(', '));console.error('See VERCEL_SETUP.md before redeploying.');process.exit(1);}
if(process.env.AUTH_SECRET.length<32){console.error('AUTH_SECRET must contain at least 32 random characters.');process.exit(1);}
if(Buffer.from(process.env.SETTINGS_ENCRYPTION_KEY,'base64').length!==32){console.error('SETTINGS_ENCRYPTION_KEY must encode exactly 32 random bytes.');process.exit(1);}
try{const url=new URL(process.env.DATABASE_URL);if(!['postgres:','postgresql:'].includes(url.protocol))throw Error();}catch{console.error('DATABASE_URL must be a valid PostgreSQL connection string.');process.exit(1);}
console.log('Required environment variable names and formats verified.');
