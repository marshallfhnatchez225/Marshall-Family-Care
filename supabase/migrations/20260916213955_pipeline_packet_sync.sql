create function private.os_packet_name() returns trigger language plpgsql security definer set search_path='' as $$
declare full_name text;
begin
 if new.metadata->>'section'<>'general' then return new; end if;
 full_name:=trim(new.metadata->'responses'->>'fullName');
 if full_name is null or length(full_name) not between 2 and 200 then return new; end if;
 if new.status not in ('submitted','approved') then return new; end if;
 if (current_setting('request.jwt.claims',true)::jsonb->>'role') is distinct from 'service_role' and
 (auth.uid() is null or new.organization_id is distinct from public.current_organization_id()) then raise exception 'Unauthorized packet change'; end if;
 update public.cases set metadata=jsonb_set(metadata,'{decedent_name}',to_jsonb(full_name)),updated_at=now()
 where id=new.case_id and organization_id=new.organization_id and metadata->>'decedent_name' is distinct from full_name;
 update public.families f set name=full_name||' Family',updated_at=now() from public.cases c
 where c.id=new.case_id and f.id=c.family_id and f.organization_id=new.organization_id and f.name is distinct from full_name||' Family';
 return new;
end $$;
revoke all on function private.os_packet_name() from public,anon,authenticated;
create trigger os_packet_name after update on public.documents for each row execute function private.os_packet_name();
