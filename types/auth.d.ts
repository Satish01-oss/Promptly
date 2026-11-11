import 'next-auth';
declare module 'next-auth' { interface Session { admin:boolean } }
