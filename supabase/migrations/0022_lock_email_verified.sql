-- ===========================================================================
-- Alpha Adventures — 0022 lock email_verified to service-role (IDEMPOTENT).
-- profiles_update_own (0003) lets a user PATCH any own column, incl.
-- email_verified — so a user could self-verify. Decision: keep booking guest-
-- first (no verification gate), but make the flag trustworthy so it CAN be
-- relied on later. A column REVOKE is a no-op under a table-level UPDATE grant,
-- and RLS WITH CHECK can't see OLD — so use a BEFORE UPDATE trigger that ignores
-- email_verified changes from anyone but the service role. The verify-email flow
-- writes it via the service-role client (bypasses this). Apply in the SQL Editor.
-- ===========================================================================

-- (Harmless defense-in-depth; ineffective alone under the table grant.)
revoke update (email_verified) on public.profiles from anon, authenticated;

-- NOT security definer: the trigger must see the CALLER's role (current_user).
-- Under SECURITY DEFINER current_user would be the function owner, blocking
-- everyone (incl. the service role). It only reads OLD/NEW, so no elevation needed.
create or replace function guard_email_verified() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Only the service role may change email_verified; silently keep the old value
  -- for anyone else so their other profile edits still succeed.
  if new.email_verified is distinct from old.email_verified and current_user <> 'service_role' then
    new.email_verified := old.email_verified;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_email_verified on public.profiles;
create trigger trg_guard_email_verified before update on public.profiles
  for each row execute function guard_email_verified();
