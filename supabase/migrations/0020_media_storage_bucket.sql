-- Media storage bucket for admin-uploaded images (trek/tour heroes, itinerary,
-- gallery, testimonial avatars). Public read so <img src> works; writes are
-- done server-side with the service role (behind requireAdmin), but we still
-- scope direct writes to admins/staff as defence in depth.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Public read of objects in this bucket.
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

-- Admin/staff writes (service-role uploads bypass RLS; this covers any
-- authenticated client path).
drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (is_admin() or is_staff()));

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (is_admin() or is_staff()));

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (is_admin() or is_staff()));
