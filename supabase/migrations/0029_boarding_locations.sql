-- 0029_boarding_locations.sql — per-trek boarding (pickup) locations, priced per traveller
-- and added to the booking total server-side (see 0031 price_booking). Up to 4 per trek,
-- enforced in the admin action (updateTrek), not in SQL.
-- Idempotent and additive: safe to re-run on the live DB or a fresh one.

create table if not exists trek_boarding_locations (
  id         uuid primary key default gen_random_uuid(),
  trek_id    uuid not null references treks(id) on delete cascade,
  name       text not null,
  subtext    text,
  price      bigint not null default 0 check (price >= 0), -- paise, per traveller
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_boarding_trek on trek_boarding_locations(trek_id, position);

alter table trek_boarding_locations enable row level security;

-- All locations are shown to buyers in checkout; staff manage them.
drop policy if exists boarding_read on trek_boarding_locations;
create policy boarding_read on trek_boarding_locations for select using (true);
drop policy if exists boarding_staff on trek_boarding_locations;
create policy boarding_staff on trek_boarding_locations for all using (is_staff()) with check (is_staff());

-- Optional free-text disclaimer shown under the boarding picker.
alter table treks add column if not exists boarding_disclaimer text;

-- The selection + a snapshot of what was charged (so receipts/ops survive the admin
-- later editing or removing the location). The FK is SET NULL so removing a location
-- never blocks on, or deletes, historical bookings.
alter table bookings add column if not exists boarding_location_id uuid references trek_boarding_locations(id) on delete set null;
alter table bookings add column if not exists boarding_name text;
alter table bookings add column if not exists boarding_total bigint not null default 0;
create index if not exists idx_bookings_boarding on bookings(boarding_location_id) where boarding_location_id is not null;
