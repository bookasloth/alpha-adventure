-- Listing/grouping fields on treks so the /treks listing pages can read from
-- Supabase instead of the static src/data/treks.js.
--   group  -> which section: 'sahyadri' | 'himalayan' | 'central' | 'backpacking' | 'near-nagpur'
--   tags   -> filter tags (beginner/moderate/difficult/fort/night/monsoon/...)
--   badge  -> optional card badge ("Adventure!", "Monsoon Special!", ...)
alter table treks add column if not exists "group" text;
alter table treks add column if not exists tags  text[] not null default '{}';
alter table treks add column if not exists badge text;

create index if not exists idx_treks_group on treks ("group");
