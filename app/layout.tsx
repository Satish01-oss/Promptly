import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Promptly — A better starting point',description:'Turn rough ideas into clear, powerful prompts with Promptly and Groq.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
