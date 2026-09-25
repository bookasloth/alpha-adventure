-- Fixed-window rate limiter backed by Postgres (no external service). Called
-- only via the service-role client behind server code. RLS on, no policies →
-- not readable/writable by anon/authenticated.
create table if not exists rate_limits (
  key          text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now()
);
alter table rate_limits enable row level security;

-- Atomic increment within the window. Returns true if the hit is allowed
-- (count within _max), false if the caller is over the limit. security definer
-- so it can upsert regardless of the caller's row policies.
create or replace function rate_limit_hit(_key text, _max int, _window int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare c int;
begin
  insert into rate_limits(key, count, window_start)
  values (_key, 1, now())
  on conflict (key) do update set
    count = case when rate_limits.window_start < now() - make_interval(secs => _window)
                 then 1 else rate_limits.count + 1 end,
    window_start = case when rate_limits.window_start < now() - make_interval(secs => _window)
                        then now() else rate_limits.window_start end
  returning count into c;
  return c <= _max;
end $$;
