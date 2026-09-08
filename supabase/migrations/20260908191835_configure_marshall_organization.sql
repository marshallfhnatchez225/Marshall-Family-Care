do $$
declare
  marshall_org_id uuid;
  admin_role_id uuid;
  admin_user_id uuid := '74ffa207-18dc-46e9-8fcd-8bcae75e9a4b';
begin
  insert into public.organizations (name, slug, system_key)
  values ('Marshall Funeral Home', 'marshall-funeral-home', 'marshall')
  on conflict (slug) do update set name = excluded.name, updated_at = now()
  returning id into marshall_org_id;

  insert into public.roles (organization_id, key, name, permissions)
  values
    (marshall_org_id, 'administrator', 'Administrator', array['*']),
    (marshall_org_id, 'funeral_director', 'Funeral Director', array['cases.*','families.*','services.*','tasks.*','documents.*','communications.*']),
    (marshall_org_id, 'family_care', 'Family Care', array['cases.read','families.*','tasks.*','documents.*','communications.*']),
    (marshall_org_id, 'content_reviewer', 'Content Reviewer', array['cases.read','documents.read','content.*']),
    (marshall_org_id, 'staff', 'Staff', array['cases.read','families.read','services.read','tasks.*'])
  on conflict (organization_id, key) do update set name = excluded.name, permissions = excluded.permissions;

  select id into admin_role_id from public.roles where organization_id = marshall_org_id and key = 'administrator';

  insert into public.users (id, organization_id, full_name, email)
  select admin_user_id, marshall_org_id, 'Jonte Marshall', email from auth.users where id = admin_user_id
  on conflict (id) do update set organization_id = excluded.organization_id, full_name = excluded.full_name, email = excluded.email, updated_at = now();

  insert into public.user_roles (organization_id, user_id, role_id)
  values (marshall_org_id, admin_user_id, admin_role_id)
  on conflict do nothing;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('organization_id', marshall_org_id, 'role', 'administrator')
  where id = admin_user_id;
end $$;
