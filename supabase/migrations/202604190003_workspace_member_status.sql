alter table if exists profiles
add column if not exists account_status text not null default 'active',
add column if not exists disabled_at timestamptz,
add column if not exists disabled_by_profile_id uuid references profiles(id) on delete set null;

update profiles
set account_status = coalesce(nullif(trim(account_status), ''), 'active');

create index if not exists profiles_workspace_id_account_status_idx
on profiles(workspace_id, account_status);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_status_check'
  ) then
    alter table profiles
    add constraint profiles_account_status_check
    check (account_status in ('active', 'disabled'));
  end if;
end $$;
