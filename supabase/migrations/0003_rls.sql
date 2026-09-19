-- ===========================================================================
-- Alpha Adventures — 0003 RLS (IDEMPOTENT). Runs after 0002_core_schema.sql.
-- enable-rls is a no-op if already on; every policy is dropped-if-exists first.
-- Model: anon = public read of published content + insert leads.
--        customer = own bookings/payments/points/profile.
--        staff/admin = CRM + content + ops. Financial state = service role only.
-- ===========================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_roles','media','destinations','categories','tags','treks',
    'trek_tags','trek_itinerary_days','trek_itinerary_slots','trek_addons',
    'trek_sections','trek_media','trek_departures','bookings','booking_travellers',
    'booking_addons','points_ledger','payments','refunds','payment_webhook_events',
    'leads','lead_notes','testimonials','posts','pages','partners','site_settings',
    'notifications','audit_log'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ---------- Identity -------------------------------------------------------
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles for select using (id = auth.uid() or is_staff());
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

drop policy if exists user_roles_select_own on user_roles;
create policy user_roles_select_own on user_roles for select using (user_id = auth.uid() or is_admin());
drop policy if exists user_roles_admin_manage on user_roles;
create policy user_roles_admin_manage on user_roles for all using (is_admin()) with check (is_admin());

-- ---------- Public content -------------------------------------------------
drop policy if exists dest_read on destinations;
create policy dest_read on destinations for select using (status = 'published' and deleted_at is null);
drop policy if exists dest_staff on destinations;
create policy dest_staff on destinations for all using (is_staff()) with check (is_staff());

drop policy if exists cat_read on categories;
create policy cat_read on categories for select using (status = 'published');
drop policy if exists cat_staff on categories;
create policy cat_staff on categories for all using (is_staff()) with check (is_staff());

drop policy if exists tags_read on tags;
create policy tags_read on tags for select using (true);
drop policy if exists tags_staff on tags;
create policy tags_staff on tags for all using (is_staff()) with check (is_staff());

drop policy if exists treks_read on treks;
create policy treks_read on treks for select using (status = 'published' and deleted_at is null);
drop policy if exists treks_staff on treks;
create policy treks_staff on treks for all using (is_staff()) with check (is_staff());

drop policy if exists trek_tags_read on trek_tags;
create policy trek_tags_read on trek_tags for select
  using (exists (select 1 from treks t where t.id = trek_id and t.status='published' and t.deleted_at is null));
drop policy if exists trek_tags_staff on trek_tags;
create policy trek_tags_staff on trek_tags for all using (is_staff()) with check (is_staff());

drop policy if exists iti_days_read on trek_itinerary_days;
create policy iti_days_read on trek_itinerary_days for select
  using (exists (select 1 from treks t where t.id = trek_id and t.status='published' and t.deleted_at is null));
drop policy if exists iti_days_staff on trek_itinerary_days;
create policy iti_days_staff on trek_itinerary_days for all using (is_staff()) with check (is_staff());

drop policy if exists iti_slots_read on trek_itinerary_slots;
create policy iti_slots_read on trek_itinerary_slots for select
  using (exists (select 1 from trek_itinerary_days d join treks t on t.id=d.trek_id
                 where d.id = day_id and t.status='published' and t.deleted_at is null));
drop policy if exists iti_slots_staff on trek_itinerary_slots;
create policy iti_slots_staff on trek_itinerary_slots for all using (is_staff()) with check (is_staff());

drop policy if exists addons_read on trek_addons;
create policy addons_read on trek_addons for select using (active or is_staff());
drop policy if exists addons_staff on trek_addons;
create policy addons_staff on trek_addons for all using (is_staff()) with check (is_staff());

drop policy if exists sections_read on trek_sections;
create policy sections_read on trek_sections for select
  using (is_visible and exists (select 1 from treks t where t.id = trek_id and t.status='published' and t.deleted_at is null));
drop policy if exists sections_staff on trek_sections;
create policy sections_staff on trek_sections for all using (is_staff()) with check (is_staff());

drop policy if exists trek_media_read on trek_media;
create policy trek_media_read on trek_media for select
  using (exists (select 1 from treks t where t.id = trek_id and t.status='published' and t.deleted_at is null));
drop policy if exists trek_media_staff on trek_media;
create policy trek_media_staff on trek_media for all using (is_staff()) with check (is_staff());

drop policy if exists media_read_public on media;
create policy media_read_public on media for select using (visibility = 'public' or uploaded_by = auth.uid() or is_staff());
drop policy if exists media_staff on media;
create policy media_staff on media for all using (is_staff()) with check (is_staff());

drop policy if exists partners_read on partners;
create policy partners_read on partners for select using (active or is_staff());
drop policy if exists partners_staff on partners;
create policy partners_staff on partners for all using (is_staff()) with check (is_staff());

drop policy if exists testi_read on testimonials;
create policy testi_read on testimonials for select using (status = 'published' or is_staff());
drop policy if exists testi_staff on testimonials;
create policy testi_staff on testimonials for all using (is_staff()) with check (is_staff());

drop policy if exists posts_read on posts;
create policy posts_read on posts for select using ((status = 'published' and deleted_at is null) or is_staff());
drop policy if exists posts_staff on posts;
create policy posts_staff on posts for all using (is_staff()) with check (is_staff());

drop policy if exists pages_read on pages;
create policy pages_read on pages for select using (status = 'published' or is_staff());
drop policy if exists pages_staff on pages;
create policy pages_staff on pages for all using (is_staff()) with check (is_staff());

drop policy if exists settings_read on site_settings;
create policy settings_read on site_settings for select using (true);
drop policy if exists settings_admin on site_settings;
create policy settings_admin on site_settings for all using (is_admin()) with check (is_admin());

-- ---------- Departures -----------------------------------------------------
drop policy if exists dep_read on trek_departures;
create policy dep_read on trek_departures for select using (status <> 'cancelled' or is_staff());
drop policy if exists dep_staff on trek_departures;
create policy dep_staff on trek_departures for all using (is_staff()) with check (is_staff());

-- ---------- Bookings (owner reads; draft writes; money/status = server) ----
drop policy if exists bookings_select on bookings;
create policy bookings_select on bookings for select using (user_id = auth.uid() or is_staff());
drop policy if exists bookings_insert on bookings;
create policy bookings_insert on bookings for insert with check (user_id = auth.uid() and status = 'draft');
drop policy if exists bookings_update_draft on bookings;
create policy bookings_update_draft on bookings for update
  using (user_id = auth.uid() and status = 'draft')
  with check (user_id = auth.uid() and status in ('draft','pending_payment'));
drop policy if exists bookings_staff on bookings;
create policy bookings_staff on bookings for all using (is_staff()) with check (is_staff());

drop policy if exists trav_owner on booking_travellers;
create policy trav_owner on booking_travellers for all
  using (exists (select 1 from bookings b where b.id = booking_id and (b.user_id = auth.uid() or is_staff())))
  with check (exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid() and b.status = 'draft') or is_staff());

drop policy if exists baddon_owner on booking_addons;
create policy baddon_owner on booking_addons for all
  using (exists (select 1 from bookings b where b.id = booking_id and (b.user_id = auth.uid() or is_staff())))
  with check (exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid() and b.status = 'draft') or is_staff());

-- ---------- Points / Payments / Refunds (read own; write = service role) ---
drop policy if exists points_select on points_ledger;
create policy points_select on points_ledger for select using (user_id = auth.uid() or is_staff());

drop policy if exists payments_select on payments;
create policy payments_select on payments for select
  using (is_staff() or exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid()));
drop policy if exists refunds_select on refunds;
create policy refunds_select on refunds for select
  using (is_staff() or exists (select 1 from payments p join bookings b on b.id = p.booking_id
                               where p.id = payment_id and b.user_id = auth.uid()));
-- payment_webhook_events: no policy => service role only.

-- ---------- Leads (public insert; staff manage) ---------------------------
drop policy if exists leads_insert_public on leads;
create policy leads_insert_public on leads for insert with check (true);
drop policy if exists leads_staff on leads;
create policy leads_staff on leads for all using (is_staff()) with check (is_staff());
drop policy if exists lead_notes_staff on lead_notes;
create policy lead_notes_staff on lead_notes for all using (is_staff()) with check (is_staff());

-- ---------- Notifications / Audit -----------------------------------------
drop policy if exists notif_select on notifications;
create policy notif_select on notifications for select using (user_id = auth.uid() or is_admin());
drop policy if exists audit_select on audit_log;
create policy audit_select on audit_log for select using (is_admin());
