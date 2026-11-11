import { authorizeAdmin,json } from '../../../../lib/admin-auth';
import { getOverview } from '../../../../lib/settings-store';
export async function GET(){const auth=await authorizeAdmin();if(auth.response)return auth.response;try{return json({...await getOverview(),adminEmail:auth.user!.email})}catch{return json({error:'Dashboard data is unavailable. Check the database connection and migration.'},503)}}
