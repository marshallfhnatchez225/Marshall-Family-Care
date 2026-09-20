begin;
select set_config('request.jwt.claims',jsonb_build_object('sub','74ffa207-18dc-46e9-8fcd-8bcae75e9a4b','role','authenticated','app_metadata',jsonb_build_object('organization_id',(select id from public.organizations where slug='marshall-funeral-home')))::text,true);
set local role authenticated;
do $$ declare cid uuid; org uuid:=public.current_organization_id(); begin
 insert into public.delivery_settings(organization_id,email_enabled) values(org,true) on conflict(organization_id) do update set email_enabled=true;
 cid:=public.create_pipeline_case('EMAIL QUEUE TEST','queue-test@example.test','');
 perform set_config('test.email_case',cid::text,true);
 insert into public.communications(organization_id,case_id,channel,direction,subject,body) values(org,cid,'internal','outbound','No consent','Test only');
 if exists(select 1 from public.email_deliveries where case_id=cid) then raise exception 'Queued without family consent'; end if;
 update public.cases set metadata=metadata||'{"email_updates_enabled":true}'::jsonb where id=cid;
 insert into public.communications(organization_id,case_id,channel,direction,subject,body) values(org,cid,'internal','outbound','Consent granted','Test only');
 if (select count(*) from public.email_deliveries where case_id=cid)<>1 then raise exception 'Queue missing'; end if;
 if has_function_privilege('authenticated','public.claim_family_email(uuid)','execute') then raise exception 'Staff can claim worker queue'; end if;
end $$;
reset role;
set local role service_role;
do $$ declare item public.email_deliveries; org uuid:=public.current_organization_id(); begin
 select * into item from public.claim_family_email(org);
 if item.id is null or item.status<>'sending' or item.attempts<>1 then raise exception 'Atomic claim failed'; end if;
 if exists(select 1 from public.claim_family_email(org)) then raise exception 'Duplicate claim allowed'; end if;
 update public.email_deliveries set started_at=now()-interval '10 minutes' where id=item.id;
 perform public.claim_family_email(org);
 if not exists(select 1 from public.email_deliveries where id=item.id and status='uncertain') then raise exception 'Interrupted delivery was not held'; end if;
end $$;
reset role;
rollback;

