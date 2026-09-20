import {timingSafeEqual} from 'node:crypto';
import {processEmailQueue} from '@/lib/notification-worker';
export const maxDuration=60;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 const received=request.headers.get('authorization')||'';
 const expected=`Bearer ${secret}`;
 if(!secret||secret.length<32||received.length!==expected.length||!timingSafeEqual(Buffer.from(received),Buffer.from(expected)))return new Response('Unauthorized',{status:401});
 try{return Response.json(await processEmailQueue(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Delivery processing failed.'},{status:500});}
}
export const POST=GET;
