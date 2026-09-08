begin;
alter table public.cars add column if not exists contract_details jsonb not null default '{}'::jsonb;
grant select (contract_details), update (contract_details) on public.cars to anon, authenticated;
notify pgrst, 'reload schema';
commit;
