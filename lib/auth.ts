import 'server-only';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { allowedGoogleProfile,isAdminEmail } from './admin-policy';

export const {handlers,auth,signIn,signOut}=NextAuth({
  providers:[Google({authorization:{params:{prompt:'select_account'}}})],
  session:{strategy:'jwt',maxAge:8*60*60},
  trustHost:process.env.VERCEL==='1'||process.env.NODE_ENV!=='production'||Boolean(process.env.AUTH_URL),
  pages:{signIn:'/admin',error:'/admin'},
  callbacks:{
    signIn({account,profile}){return account?.provider==='google'&&allowedGoogleProfile(profile);},
    jwt({token,account,profile}){if(account)token.isAdmin=account.provider==='google'&&allowedGoogleProfile(profile);return token;},
    session({session,token}){session.admin=token.isAdmin===true&&isAdminEmail(token.email);return session;},
  },
});
