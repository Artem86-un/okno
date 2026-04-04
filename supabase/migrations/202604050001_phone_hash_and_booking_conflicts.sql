alter table if exists clients
add column if not exists phone_hash text;

create index if not exists clients_profile_id_phone_hash_idx
on clients(profile_id, phone_hash);

create unique index if not exists clients_profile_id_phone_hash_unique_idx
on clients(profile_id, phone_hash)
where phone_hash is not null;

create or replace function public.has_booking_conflict(
  p_profile_id uuid,
  p_candidate_start timestamptz,
  p_candidate_busy_end timestamptz,
  p_buffer_minutes integer
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from bookings
    where profile_id = p_profile_id
      and status = 'confirmed'
      and p_candidate_start < ends_at + make_interval(mins => greatest(p_buffer_minutes, 0))
      and p_candidate_busy_end > starts_at

    union all

    select 1
    from blocked_slots
    where profile_id = p_profile_id
      and p_candidate_start < ends_at
      and p_candidate_busy_end > starts_at
  );
$$;
