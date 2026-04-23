alter table if exists profiles
add column if not exists workspace_id uuid,
add column if not exists workspace_name text,
add column if not exists workspace_kind text not null default 'solo',
add column if not exists account_role text not null default 'solo',
add column if not exists created_by_profile_id uuid references profiles(id) on delete set null;

update profiles
set
  workspace_id = coalesce(workspace_id, id),
  workspace_name = coalesce(nullif(trim(workspace_name), ''), full_name),
  workspace_kind = coalesce(nullif(trim(workspace_kind), ''), 'solo'),
  account_role = coalesce(nullif(trim(account_role), ''), 'solo');

alter table if exists profiles
alter column workspace_id set not null;

alter table if exists profiles
alter column workspace_name set not null;

create index if not exists profiles_workspace_id_idx on profiles(workspace_id);
create index if not exists profiles_workspace_id_account_role_idx
on profiles(workspace_id, account_role);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_workspace_kind_check'
  ) then
    alter table profiles
    add constraint profiles_workspace_kind_check
    check (workspace_kind in ('solo', 'studio', 'barbershop', 'company'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_role_check'
  ) then
    alter table profiles
    add constraint profiles_account_role_check
    check (account_role in ('solo', 'admin', 'staff'));
  end if;
end $$;
