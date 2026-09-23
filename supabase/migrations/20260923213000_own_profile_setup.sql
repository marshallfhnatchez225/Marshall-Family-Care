create or replace function public.update_own_profile(preferred_name text)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare clean_name text:=trim(regexp_replace(coalesce(preferred_name,''),'\s+',' ','g'));
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if length(clean_name)<2 or length(clean_name)>100 then raise exception 'Preferred name must be between 2 and 100 characters'; end if;
  update public.users set full_name=clean_name,updated_at=now() where id=auth.uid();
  if not found then raise exception 'Staff profile not found'; end if;
end;
$$;

revoke all on function public.update_own_profile(text) from public,anon;
grant execute on function public.update_own_profile(text) to authenticated;
