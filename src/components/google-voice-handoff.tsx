'use client';
import {useState} from 'react';

export function GoogleVoiceHandoff({phone,message}:{phone:string;message:string}){
 const [copied,setCopied]=useState(false);
 async function openVoice(){
  window.open('https://voice.google.com/u/0/messages','_blank','noopener,noreferrer');
  try{await navigator.clipboard.writeText(message);setCopied(true);}catch{setCopied(false);}
 }
 return <div className="voice-handoff"><p><strong>Google Voice recipient:</strong> {phone||'Phone number not recorded'}</p><label>Message ready to send<textarea readOnly rows={7} value={message} onFocus={event=>event.currentTarget.select()}/></label><button className="primary" type="button" onClick={openVoice} disabled={!phone}>{copied?'Copied · Google Voice opened':'Copy message & open Google Voice'}</button><small>Paste the message into the conversation for this number, review it, and press Send in Google Voice.</small></div>;
}
