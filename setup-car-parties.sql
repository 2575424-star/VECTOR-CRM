-- Run in Supabase SQL Editor before merging the interface update.
-- Uses the existing CRM test-access model. No real personal data is inserted.
begin;
alter table public.cars add column if not exists seller jsonb not null default '{}'::jsonb;
alter table public.cars add column if not exists buyer jsonb not null default '{}'::jsonb;
grant select (seller, buyer), update (seller, buyer) on public.cars to anon, authenticated;
notify pgrst, 'reload schema';
commit;
