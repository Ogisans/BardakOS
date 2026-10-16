-- NEW fictional project only. No passwords, service key, or business records.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
create function private.valid_quantity(value bigint) returns boolean
language sql immutable set search_path = '' as $$
  select value is null or value between 0 and 9007199254740991;
$$;
-- No scale: reject sub-cent input instead of silently rounding it.
create function private.valid_money(value numeric) returns boolean
language sql immutable set search_path = '' as $$
  select value is null or (value between 0 and 90071992547409.91 and value = trunc(value, 2));
$$;
create table public.bardak_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 100),
  purpose text not null default 'demo' check (purpose = 'demo')
);
create table public.bardak_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Çalışma alanı kullanıcısı' check (length(btrim(display_name)) between 1 and 80),
  work_note text not null default '' check (length(work_note) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.bardak_memberships (
  workspace_id uuid not null references public.bardak_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','field')),
  active boolean not null default true,
  primary key (workspace_id, user_id)
);
create index bardak_memberships_user_idx on public.bardak_memberships(user_id);
create function private.is_workspace_member(workspace uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.bardak_memberships m
    where m.workspace_id = workspace and m.user_id = (select auth.uid()) and m.active
  );
$$;
create function private.is_workspace_admin(workspace uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.bardak_memberships m
    where m.workspace_id = workspace and m.user_id = (select auth.uid()) and m.active and m.role = 'admin'
  );
$$;
create function private.create_bardak_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Ignore signup metadata; it never grants a role or membership.
  insert into public.bardak_profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger bardak_auth_profile after insert on auth.users
for each row execute function private.create_bardak_profile();
create function private.touch_bardak_record() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger bardak_profiles_timestamp before update on public.bardak_profiles
for each row execute function private.touch_bardak_record();
create table public.bardak_collections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.bardak_workspaces(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  name text not null check (length(btrim(name)) between 1 and 100),
  description text not null default '' check (length(description) <= 600),
  status text not null default 'planning' check (status in ('planning','sampling','production','on_sale','archived')),
  start_date date check (start_date between date '0001-01-01' and date '9999-12-31'),
  target_date date check (target_date between date '0001-01-01' and date '9999-12-31'),
  production_target bigint check (private.valid_quantity(production_target)),
  produced_quantity bigint check (private.valid_quantity(produced_quantity)),
  sales_target bigint check (private.valid_quantity(sales_target)),
  sold_quantity bigint check (private.valid_quantity(sold_quantity)),
  planned_budget numeric check (private.valid_money(planned_budget)),
  actual_revenue numeric check (private.valid_money(actual_revenue)),
  actual_expense numeric check (private.valid_money(actual_expense)),
  finance_quality text not null default 'unverified' check (finance_quality in ('unverified','approximate','confirmed')),
  notes text not null default '' check (length(notes) <= 2000),
  manually_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, workspace_id),
  check (start_date is null or target_date is null or start_date <= target_date),
  check (produced_quantity is null or sold_quantity is null or sold_quantity <= produced_quantity)
);
create index bardak_collections_workspace_idx on public.bardak_collections(workspace_id);
create function private.touch_bardak_collection() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); new.manually_edited = true; return new; end;
$$;
create trigger bardak_collections_timestamp before update on public.bardak_collections
for each row execute function private.touch_bardak_collection();
create table public.bardak_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  collection_id uuid not null,
  kind text not null check (kind in ('product','production','campaign')),
  title text not null check (length(btrim(title)) between 1 and 120),
  notes text not null default '' check (length(notes) <= 2000),
  status text not null default 'planned' check (status in ('planned','in_progress','completed')),
  date date check (date between date '0001-01-01' and date '9999-12-31'),
  sku text not null default '' check (length(sku) <= 60),
  quantity bigint check (private.valid_quantity(quantity)),
  unit_price numeric check (private.valid_money(unit_price)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (collection_id, workspace_id) references public.bardak_collections(id, workspace_id) on delete cascade,
  check (kind = 'product' or (sku = '' and quantity is null and unit_price is null))
);
create index bardak_entries_parent_idx on public.bardak_entries(workspace_id, collection_id);
create trigger bardak_entries_timestamp before update on public.bardak_entries
for each row execute function private.touch_bardak_record();
create table public.bardak_assets (
  id text primary key,
  name text not null,
  path text not null check (path like '/collection-assets/%')
);
create table public.bardak_file_references (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  collection_id uuid not null,
  asset_id text not null references public.bardak_assets(id),
  created_at timestamptz not null default now(),
  foreign key (collection_id, workspace_id) references public.bardak_collections(id, workspace_id) on delete cascade,
  unique (collection_id, asset_id)
);
create index bardak_files_parent_idx on public.bardak_file_references(workspace_id, collection_id);

-- Revoke default table grants. RLS and column privileges BOTH apply.
revoke all on public.bardak_workspaces, public.bardak_profiles, public.bardak_memberships,
 public.bardak_collections, public.bardak_entries, public.bardak_assets, public.bardak_file_references from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_workspace_member(uuid), private.is_workspace_admin(uuid), private.valid_quantity(bigint), private.valid_money(numeric) to authenticated;
grant select on public.bardak_workspaces, public.bardak_profiles, public.bardak_memberships,
 public.bardak_collections, public.bardak_entries, public.bardak_assets, public.bardak_file_references to authenticated;
grant update(display_name, work_note) on public.bardak_profiles to authenticated;
grant insert(workspace_id,name,description,status,start_date,target_date,production_target,produced_quantity,sales_target,sold_quantity,planned_budget,actual_revenue,actual_expense,finance_quality,notes),
 update(name,description,status,start_date,target_date,production_target,produced_quantity,sales_target,sold_quantity,planned_budget,actual_revenue,actual_expense,finance_quality,notes), delete on public.bardak_collections to authenticated;
grant insert(workspace_id,collection_id,kind,title,notes,status,date,sku,quantity,unit_price),
 update(title,notes,status,date,sku,quantity,unit_price), delete on public.bardak_entries to authenticated;
grant insert(workspace_id,collection_id,asset_id), delete on public.bardak_file_references to authenticated;
alter table public.bardak_workspaces enable row level security;
alter table public.bardak_profiles enable row level security;
alter table public.bardak_memberships enable row level security;
alter table public.bardak_collections enable row level security;
alter table public.bardak_entries enable row level security;
alter table public.bardak_assets enable row level security;
alter table public.bardak_file_references enable row level security;
create policy workspace_member_read on public.bardak_workspaces for select to authenticated using (private.is_workspace_member(id));
create policy profile_self_read on public.bardak_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profile_self_update on public.bardak_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy membership_self_read on public.bardak_memberships for select to authenticated using (user_id = (select auth.uid()));
create policy asset_catalogue_read on public.bardak_assets for select to authenticated using ((select auth.uid()) is not null);
create policy collection_admin_read on public.bardak_collections for select to authenticated using (private.is_workspace_admin(workspace_id));
create policy collection_admin_create on public.bardak_collections for insert to authenticated with check (private.is_workspace_admin(workspace_id) and created_by = (select auth.uid()));
create policy collection_admin_update on public.bardak_collections for update to authenticated using (private.is_workspace_admin(workspace_id)) with check (private.is_workspace_admin(workspace_id));
create policy collection_admin_delete on public.bardak_collections for delete to authenticated using (private.is_workspace_admin(workspace_id));
create policy entry_admin_read on public.bardak_entries for select to authenticated using (private.is_workspace_admin(workspace_id));
create policy entry_admin_create on public.bardak_entries for insert to authenticated with check (private.is_workspace_admin(workspace_id));
create policy entry_admin_update on public.bardak_entries for update to authenticated using (private.is_workspace_admin(workspace_id)) with check (private.is_workspace_admin(workspace_id));
create policy entry_admin_delete on public.bardak_entries for delete to authenticated using (private.is_workspace_admin(workspace_id));
create policy file_admin_read on public.bardak_file_references for select to authenticated using (private.is_workspace_admin(workspace_id));
create policy file_admin_create on public.bardak_file_references for insert to authenticated with check (private.is_workspace_admin(workspace_id));
create policy file_admin_delete on public.bardak_file_references for delete to authenticated using (private.is_workspace_admin(workspace_id));
commit;
