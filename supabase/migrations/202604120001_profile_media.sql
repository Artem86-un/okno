alter table if exists profiles
add column if not exists portfolio_works jsonb not null default '[]'::jsonb;
