create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_auth_id text not null,
  full_name text not null,
  username text not null unique,
  specialty text not null,
  bio text not null default '',
  location_text text not null default '',
  timezone text not null default 'Europe/Simferopol',
  telegram_chat_id text,
  avatar_url text,
  subscription_tier text not null default 'free',
  monthly_booking_limit integer not null default 50,
  created_at timestamptz not null default now()
);
create index if not exists profiles_password_auth_id_idx on profiles(password_auth_id);
create index if not exists profiles_username_idx on profiles(username);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  price integer not null check (price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0
);
create index if not exists services_profile_id_idx on services(profile_id);

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  weekday integer not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true
);

create table if not exists blocked_slots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default ''
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  phone_encrypted text not null,
  phone_last4 text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  last_booking_at timestamptz
);
create index if not exists clients_profile_id_idx on clients(profile_id);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  status text not null default 'confirmed',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  source text not null default 'public_page',
  client_note text not null default '',
  cancellation_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  cancellation_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create index if not exists bookings_profile_id_idx on bookings(profile_id);
create index if not exists bookings_cancellation_token_idx on bookings(cancellation_token);

create table if not exists notification_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  status text not null default 'queued',
  target text not null,
  created_at timestamptz not null default now()
);

create table if not exists auth_telegram_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  telegram_user_id text not null unique,
  telegram_handle text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table services enable row level security;
alter table availability_rules enable row level security;
alter table blocked_slots enable row level security;
alter table clients enable row level security;
alter table bookings enable row level security;
alter table notification_events enable row level security;
alter table auth_telegram_links enable row level security;

create policy "Owners can manage own profile" on profiles
for all
using (password_auth_id = auth.uid()::text)
with check (password_auth_id = auth.uid()::text);

create policy "Owners can manage own services" on services
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = services.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = services.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
);

create policy "Owners can manage own availability" on availability_rules
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = availability_rules.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = availability_rules.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
);

create policy "Owners can manage own blocked slots" on blocked_slots
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = blocked_slots.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = blocked_slots.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
);

create policy "Owners can manage own clients" on clients
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = clients.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = clients.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
);

create policy "Owners can manage own bookings" on bookings
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = bookings.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = bookings.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
);

create policy "Owners can manage own notifications" on notification_events
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = notification_events.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = notification_events.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
);

create policy "Owners can manage own telegram links" on auth_telegram_links
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth_telegram_links.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth_telegram_links.profile_id
      and profiles.password_auth_id = auth.uid()::text
  )
);
