-- 0028_team_members.sql — admin-managed list of team members (names only, no logins)
-- so a booking can be tagged with an "Account manager" at checkout (commission attribution).
-- Idempotent and additive: safe to re-run on the live DB or a fresh one.

create table if not exists team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table team_members enable row level security;

-- Names are shown in the public checkout dropdown; staff manage the list.
drop policy if exists team_read on team_members;
create policy team_read on team_members for select using (true);
drop policy if exists team_staff on team_members;
create policy team_staff on team_members for all using (is_staff()) with check (is_staff());

drop trigger if exists t_upd on team_members;
create trigger t_upd before update on team_members for each row execute function set_updated_at();

-- The tag. Nullable (optional at checkout); validated server-side against active members.
alter table bookings add column if not exists account_manager_id uuid references team_members(id);
create index if not exists idx_bookings_account_manager on bookings(account_manager_id) where account_manager_id is not null;
