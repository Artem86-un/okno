create or replace function public.has_booking_conflict_excluding_current(
  p_profile_id uuid,
  p_candidate_start timestamptz,
  p_candidate_busy_end timestamptz,
  p_buffer_minutes integer,
  p_exclude_booking_id uuid
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
      and id <> p_exclude_booking_id
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
