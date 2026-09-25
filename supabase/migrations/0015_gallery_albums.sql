-- Gallery albums so /gallery (+ /gallery/[slug]) read from Supabase. Each album
-- is per-slug metadata (title/subtitle/hero); the seasonal photo grids on the
-- detail page remain a shared template. Public reads published; writes = staff.
create table if not exists gallery_albums (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  subtitle   text,
  hero       text,
  hero_alt   text,
  sort       smallint not null default 0,
  status     content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_gallery_albums_status on gallery_albums (status);

alter table gallery_albums enable row level security;

drop policy if exists gallery_albums_public_read on gallery_albums;
create policy gallery_albums_public_read on gallery_albums for select
  using (status = 'published' and deleted_at is null);

drop policy if exists gallery_albums_staff on gallery_albums;
create policy gallery_albums_staff on gallery_albums for all using (is_staff()) with check (is_staff());
