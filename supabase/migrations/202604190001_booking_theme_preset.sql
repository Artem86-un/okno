alter table if exists profiles
add column if not exists booking_theme_preset text not null default 'linen';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_booking_theme_preset_check'
  ) then
    alter table profiles
    add constraint profiles_booking_theme_preset_check
    check (booking_theme_preset in ('linen', 'merlot', 'lagoon', 'rosewood'));
  end if;
end $$;
