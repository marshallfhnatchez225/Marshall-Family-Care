-- Keep the approved family wording in the queued delivery itself, so browser
-- verification and the communication record match the text sent to the family.
create or replace function public.queue_voice_intake(target_case uuid, sections text[], link_hash text, portal_url text) returns uuid
language plpgsql security definer set search_path='' as $$
declare
 c public.cases; existing uuid; phone text; link_id uuid; comm_id uuid; job_id uuid;
 message text; kin_first text; decedent text; document_names text[]; document_list text; document_count integer;
begin
 if not private.os_permission('communications.write') or not private.os_permission('cases.write') or not private.os_permission('documents.write') or not private.os_permission('families.write') then raise exception 'Intake sending permission required'; end if;
 select * into c from public.cases where id=target_case and organization_id=public.current_organization_id() for update;
 if not found then raise exception 'Case unavailable'; end if;
 select id into existing from public.voice_deliveries where case_id=c.id and status<>'cancelled';
 if found then return existing; end if;
 if c.stage<>'intake' then raise exception 'This case has already left Intake'; end if;
 if cardinality(sections) is null or cardinality(sections)<1 or not sections <@ array['embalming','general','obituary','deathCertificate']::text[] then raise exception 'Choose valid first-call documents'; end if;
 if portal_url !~ '^https://marshall-os\.vercel\.app/family/[A-Za-z0-9_-]{43}$' or link_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid private link'; end if;
 phone:=regexp_replace(coalesce(c.metadata->>'family_mobile',''),'[^0-9]','','g');
 if length(phone)=10 then phone:='1'||phone; end if;
 phone:='+'||phone;
 if phone !~ '^\+1[2-9][0-9]{9}$' then raise exception 'Enter a valid US family mobile number before sending'; end if;

 select array_agg(case s
   when 'embalming' then 'Permission to Embalm'
   when 'general' then 'General Information'
   when 'obituary' then 'Obituary'
   else 'Death Certificate Worksheet' end order by ordinal)
 into document_names from unnest(sections) with ordinality as selected(s,ordinal);
 document_count:=cardinality(document_names);
 document_list:=case document_count
   when 1 then document_names[1]
   when 2 then document_names[1]||' and '||document_names[2]
   else array_to_string(document_names[1:document_count-1],', ')||', and '||document_names[document_count]
 end;
 kin_first:=split_part(btrim(regexp_replace(coalesce(c.metadata->>'next_of_kin_name',''),'[[:space:]]+',' ','g')),' ',1);
 decedent:=btrim(regexp_replace(coalesce(c.metadata->>'decedent_name',''),'[[:space:]]+',' ','g'));
 if lower(decedent) in ('awaiting family packet','awaiting family information') then decedent:=''; end if;
 message:=(case when kin_first<>'' then 'Hi '||kin_first else 'Hello' end)
   ||', this is Marshall Funeral Home. Our deepest sympathy for your loss. When you are ready, please complete the private family packet'
   ||(case when decedent<>'' then ' for '||decedent else '' end)
   ||'. It includes '||document_list||'. You can save each section as you go, then select “Submit for staff review” when finished. The link expires in 7 days.'
   ||E'\n\n'
   ||'If you need help, feel free to reach out here or call the funeral home, and we will guide you. We will continue to keep you in our prayers.'
   ||E'\n\n'||portal_url;

 insert into public.portal_links(organization_id,case_id,token_hash,expires_at) values(c.organization_id,c.id,link_hash,now()+interval '7 days') returning id into link_id;
 insert into public.communications(organization_id,case_id,channel,direction,subject,body,status,created_by) values(c.organization_id,c.id,'sms','outbound','Your Marshall Family Care first-call packet',message,'queued',auth.uid()) returning id into comm_id;
 insert into public.voice_deliveries(organization_id,case_id,communication_id,portal_link_id,recipient,body,created_by) values(c.organization_id,c.id,comm_id,link_id,phone,message,auth.uid()) returning id into job_id;
 update public.documents set status='requested',updated_at=now() where case_id=c.id and metadata->>'section'=any(sections) and status not in ('approved','submitted');
 update public.cases set metadata=metadata||jsonb_build_object('intake_prepared_at',now(),'intake_documents',sections,'voice_delivery_id',job_id),updated_at=now() where id=c.id;
 return job_id;
end $$;
