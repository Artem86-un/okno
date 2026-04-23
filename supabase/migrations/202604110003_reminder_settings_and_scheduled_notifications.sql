alter table if exists profiles
add column if not exists client_reminder_hours integer not null default 24;

alter table if exists profiles
add column if not exists master_reminder_hours integer not null default 2;

alter table if exists notification_events
add column if not exists scheduled_for timestamptz;

create index if not exists notification_events_status_scheduled_idx
on notification_events(status, scheduled_for);
