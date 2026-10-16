-- Trusted Dashboard SQL Editor ONLY, after migration + seed.
-- Create two confirmed, FICTIONAL Auth users first. Paste their UUIDs below.
-- Never put passwords, email addresses or any project secret in this file.
begin;
do $$
declare
  admin_user_id uuid := null; -- Replace NULL with 'UUID'::uuid
  field_user_id uuid := null; -- Replace NULL with 'UUID'::uuid
  delivery_workspace uuid := 'b4d00000-0000-4000-8000-000000000001';
begin
  if admin_user_id is null or field_user_id is null or admin_user_id = field_user_id then
    raise exception 'Set two distinct fictional Auth user UUIDs before running.';
  end if;
  if (select count(*) from auth.users where id in (admin_user_id, field_user_id)) <> 2 then
    raise exception 'Both Auth users must already exist.';
  end if;
  -- Also supports users created just before installing the profile trigger.
  insert into public.bardak_profiles(user_id,display_name) values
    (admin_user_id,'Deniz Kaya'), (field_user_id,'Ece Demir') on conflict do nothing;
  update public.bardak_profiles set display_name = case when user_id = admin_user_id then 'Deniz Kaya' else 'Ece Demir' end
    where user_id in (admin_user_id, field_user_id) and display_name = 'Çalışma alanı kullanıcısı' and work_note = '';
  insert into public.bardak_memberships(workspace_id,user_id,role,active) values
    (delivery_workspace,admin_user_id,'admin',true), (delivery_workspace,field_user_id,'field',true)
    on conflict do nothing;
end;
$$;
commit;
