-- Выполнить один раз перед установкой интерфейса документов.
-- Существующие файлы получат категорию «Прочее». Права доступа не меняются.
begin;
alter table public.car_files add column if not exists category text not null default 'other';
alter table public.car_files add column if not exists comment text not null default '';
notify pgrst, 'reload schema';
commit;
