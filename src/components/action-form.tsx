'use client';
import { useActionState } from 'react';
import {GoogleVoiceHandoff} from './google-voice-handoff';
export type ActionState = { error?: string; message?: string; link?: string; voicePhone?: string; voiceMessage?: string };
type SecondarySubmit = { label:string; name:string; value:string };
export function ActionForm({action,children,submit='Save',submitName,submitValue,secondarySubmit,className='',id}:{action:(state:ActionState,form:FormData)=>Promise<ActionState>;children:React.ReactNode;submit?:string;submitName?:string;submitValue?:string;secondarySubmit?:SecondarySubmit;className?:string;id?:string}) {
 const [state,formAction,pending]=useActionState(async (previous:ActionState,form:FormData)=>{
  const localTime=form.get('starts_local');
  if(typeof localTime==='string'&&localTime){const date=new Date(localTime);if(Number.isFinite(date.getTime()))form.set('starts_at',date.toISOString());}
  return action(previous,form);
 },{});
 return <form id={id} action={formAction} className={`workflow-form ${className}`}>
  <fieldset disabled={pending}>{children}</fieldset>
  {secondarySubmit?<div className="form-submit-row">
   <button className="primary" disabled={pending} type="submit" name={submitName} value={submitValue}>{pending?'Saving…':submit}</button>
   <button className="secondary" disabled={pending} type="submit" name={secondarySubmit.name} value={secondarySubmit.value}>{pending?'Saving…':secondarySubmit.label}</button>
  </div>:<button className="primary" disabled={pending} type="submit" name={submitName} value={submitValue}>{pending?'Saving…':submit}</button>}
  <div aria-live="polite">{state.error&&<p className="formerror">{state.error}</p>}{state.message&&<p className="workflow-success">{state.message}</p>}{state.link&&<label>Private family link<input readOnly value={state.link} onFocus={e=>e.target.select()}/><a className="link" href={state.link} target="_blank" rel="noreferrer">Open family portal</a></label>}{state.voiceMessage&&<GoogleVoiceHandoff phone={state.voicePhone||''} message={state.voiceMessage}/>}</div>
 </form>;
}
