-- Run inside a rolled-back transaction, never sends a text.
select set_config('request.jwt.claims',jsonb_build_object('sub','74ffa207-18dc-46e9-8fcd-8bcae75e9a4b','role','authenticated','app_metadata',jsonb_build_object('organization_id',(select id from public.organizations where slug='marshall-funeral-home')))::text,true);
set local role authenticated;
do $$ declare cid uuid; jid uuid; j jsonb; token uuid; n integer; begin
 cid:=public.create_pipeline_case('VOICE BRIDGE TEST','','2025550100');
 update public.cases set stage='intake',status='intake' where id=cid;
 jid:=public.queue_voice_intake(cid,array['general'],repeat('a',64),'https://marshall-os.vercel.app/family/'||repeat('a',43));
 if public.queue_voice_intake(cid,array['general'],repeat('b',64),'https://marshall-os.vercel.app/family/'||repeat('b',43))<>jid then raise exception 'Duplicate queue creation'; end if;
 if (select stage from public.cases where id=cid)<>'intake' then raise exception 'Graduated before send'; end if;
 if (select count(*) from public.portal_links where case_id=cid)<>1 then raise exception 'Duplicate private link'; end if;
 if exists(select 1 from public.email_deliveries where case_id=cid) then raise exception 'Voice message entered email queue'; end if;
 begin
  perform public.voice_job_action(jid,'sent',null,'Pretend sent without a claim');
  raise exception 'Unclaimed completion allowed';
 exception when raise_exception then if sqlerrm='Unclaimed completion allowed' then raise; end if; end;
 j:=public.voice_job_action(jid,'claim'); token:=(j->>'claim_token')::uuid;
 if j->>'status'<>'claimed' or j->>'recipient'<>'+12025550100' then raise exception 'Claim failed'; end if;
 begin
  perform public.voice_job_action(jid,'claim'); raise exception 'Double claim allowed';
 exception when raise_exception then if sqlerrm='Double claim allowed' then raise; end if; end;
 begin
  perform public.voice_job_action(jid,'cancel'); raise exception 'Cancelled active sender';
 exception when raise_exception then if sqlerrm='Cancelled active sender' then raise; end if; end;
 begin
  perform public.voice_job_action(jid,'begin',gen_random_uuid()); raise exception 'Wrong token accepted';
 exception when raise_exception then if sqlerrm='Wrong token accepted' then raise; end if; end;
 j:=public.voice_job_action(jid,'begin',token);
 j:=public.voice_job_action(jid,'sent',token,'Mock only: outgoing exact packet visible for test recipient at test timestamp.');
 if j->>'status'<>'sent' or (select stage from public.cases where id=cid)<>'arrangement' then raise exception 'Verified completion failed'; end if;
 if (select status from public.communications where id=(j->>'communication_id')::uuid)<>'sent' then raise exception 'Communication not recorded'; end if;
 cid:=public.create_pipeline_case('VOICE CONTACT CHANGE TEST','','2025550101');
 update public.cases set stage='intake',status='intake' where id=cid;
 jid:=public.queue_voice_intake(cid,array['general'],repeat('c',64),'https://marshall-os.vercel.app/family/'||repeat('c',43));
 update public.cases set metadata=metadata||'{"family_mobile":"2025550102"}' where id=cid;
 j:=public.voice_job_action(jid,'claim');
 if j->>'status'<>'cancelled' then raise exception 'Changed recipient was sent'; end if;
 jid:=public.queue_voice_intake(cid,array['general'],repeat('d',64),'https://marshall-os.vercel.app/family/'||repeat('d',43));
 j:=public.voice_job_action(jid,'claim'); token:=(j->>'claim_token')::uuid;
 j:=public.voice_job_action(jid,'begin',token);
 j:=public.voice_job_action(jid,'uncertain',token,'Mock interrupted after final send click.');
 if public.queue_voice_intake(cid,array['general'],repeat('e',64),'https://marshall-os.vercel.app/family/'||repeat('e',43))<>jid then raise exception 'Uncertain message retried'; end if;
 j:=public.voice_job_action(jid,'resolve-unsent',null,'Mock Google Voice reviewed; exact packet is absent and never sent.');
 if j->>'status'<>'cancelled' then raise exception 'Reconciliation failed'; end if;
 if has_table_privilege('authenticated','public.voice_deliveries','insert') then raise exception 'Direct queue insert permitted'; end if;
 if has_function_privilege('anon','public.queue_voice_intake(uuid,text[],text,text)','execute') then raise exception 'Anonymous queue access'; end if;
 perform set_config('test.voice_case',cid::text,true);
 perform set_config('test.voice_job',jid::text,true);
end $$;
reset role;
-- A lost browser attempt is held, never recycled into the queue.
do $$ declare jid uuid; cid uuid:=current_setting('test.voice_case')::uuid; begin
 jid:=public.queue_voice_intake(cid,array['general'],repeat('f',64),'https://marshall-os.vercel.app/family/'||repeat('f',43));
 perform public.voice_job_action(jid,'claim');
 update public.voice_deliveries set lease_until=now()-interval '1 minute' where id=jid;
 if public.voice_job_action(jid,'claim')->>'status'<>'uncertain' then raise exception 'Expired claim not held'; end if;
 if (select stage from public.cases where id=cid)<>'intake' then raise exception 'Interrupted claim graduated'; end if;
end $$;
-- Unrecognized user cannot read or mutate another user's organization queue.
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"organization_id":"00000000-0000-0000-0000-000000000002"}}',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.voice_deliveries) then raise exception 'Cross-organization disclosure'; end if;
 begin
  perform public.voice_job_action(current_setting('test.voice_job')::uuid,'claim'); raise exception 'Unauthorized claim allowed';
 exception when raise_exception then if sqlerrm='Unauthorized claim allowed' then raise; end if; end;
end $$;
reset role;
