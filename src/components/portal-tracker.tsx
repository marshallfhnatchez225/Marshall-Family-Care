'use client';
import { useEffect } from 'react';

export function PortalTracker({token,section}:{token:string;section:string}) {
 useEffect(()=>{
  fetch(`/family/${token}/track`,{
   method:'POST',
   headers:{'content-type':'application/json'},
   body:JSON.stringify({section}),
   cache:'no-store',
   keepalive:true,
  }).catch(()=>{});
 },[token,section]);
 return null;
}
