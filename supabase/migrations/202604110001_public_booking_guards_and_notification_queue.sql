create table if not exists public_booking_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  username text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists public_booking_attempts_profile_ip_created_idx
on public_booking_attempts(profile_id, ip_hash, created_at desc);

create index if not exists public_booking_attempts_username_ip_created_idx
on public_booking_attempts(username, ip_hash, created_at desc);

create table if not exists public_booking_idempotency (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  status text not null default 'processing',
  booking_id uuid references bookings(id) on delete set null,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, idempotency_key)
);

create index if not exists public_booking_idempotency_profile_created_idx
on public_booking_idempotency(profile_id, created_at desc);

alter table if exists notification_events
add column if not exists booking_id uuid references bookings(id) on delete cascade;

alter table if exists notification_events
add column if not exists payload jsonb not null default '{}'::jsonb;

alter table if exists notification_events
add column if not exists attempts integer not null default 0;

alter table if exists notification_events
add column if not exists processed_at timestamptz;

alter table if exists notification_events
add column if not exists last_error text;

create index if not exists notification_events_booking_id_idx
on notification_events(booking_id);

alter table public_booking_attempts enable row level security;
alter table public_booking_idempotency enable row level security;
