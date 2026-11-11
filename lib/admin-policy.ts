export function adminEmail(){return process.env.ADMIN_EMAIL?.trim().toLowerCase()||'ss7233563@gmail.com';}
export function isAdminEmail(email:unknown){return typeof email==='string'&&email.trim().toLowerCase()===adminEmail();}
export function allowedGoogleProfile(profile:unknown){if(!profile||typeof profile!=='object')return false;const p=profile as {email?:unknown;email_verified?:unknown};return p.email_verified===true&&isAdminEmail(p.email);}
export function authConfigured(){return Boolean(process.env.AUTH_SECRET&&process.env.AUTH_GOOGLE_ID&&process.env.AUTH_GOOGLE_SECRET);}
