alter table profiles
add column if not exists booking_window_days integer not null default 30,
add column if not exists slot_interval_minutes integer not null default 30,
add column if not exists buffer_minutes integer not null default 15,
add column if not exists cancellation_notice_hours integer not null default 2;
