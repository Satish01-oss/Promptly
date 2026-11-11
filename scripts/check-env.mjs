if(!process.env.GROQ_API_KEY?.trim()){console.error('Missing Vercel environment variable: GROQ_API_KEY');process.exit(1);}
console.log('Groq API key is configured. No database or OAuth setup is required.');
