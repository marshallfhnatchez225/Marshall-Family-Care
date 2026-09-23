do $$
declare marshall_org_id uuid;
begin
  select id into marshall_org_id from public.organizations where slug='marshall-funeral-home';
  if marshall_org_id is null then raise exception 'Marshall organization not found'; end if;

  insert into public.roles(organization_id,key,name,permissions)
  values(marshall_org_id,'intake_staff','Intake Staff',array[
    'cases.*','families.*','documents.*','communications.*','services.read','tasks.read'
  ])
  on conflict(organization_id,key) do update
  set name=excluded.name,permissions=excluded.permissions;
end $$;
