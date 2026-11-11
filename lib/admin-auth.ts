import {adminEmail} from './admin-policy';
export {adminEmail};
export const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
/** Fail closed until authentication and persistent admin storage are restored. */
export async function authorizeAdmin():Promise<{response:Response;user?:{email:string}}>{return {response:json({error:'The admin panel is temporarily disabled.'},503)};}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function readBody(request:Request,max=200000){if(Number(request.headers.get('content-length'))>max)throw Error('Request is too large.');const reader=request.body?.getReader();if(!reader)throw Error('Request body required.');let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('Request is too large.');}chunks.push(value);}const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(all));}

