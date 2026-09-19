-- 0005_decisions.sql — schema changes from the V2 decision round (2026-09-19)
-- Decisions locked with the client:
--   Payment model = BOTH (full payment OR deposit + balance)
--   Shop          = DEFERRED (no products/orders/cart tables now)
--   CMS scope     = CORE + CONTENT (adds seo_meta + faqs)
--   Reviews       = VERIFIED (booking-linked reviews, moderated)
-- Idempotent and additive: safe to re-run on the live DB or a fresh one.

-- ---------------------------------------------------------------------------
-- 1. Payment model = BOTH  (schema support now; deposit *flow* ships in Phase 6)
-- ---------------------------------------------------------------------------
alter table bookings add column if not exists deposit_amount   bigint;               -- null => full payment required
alter table bookings add column if not exists amount_paid      bigint not null default 0;  -- sum of successful payments, maintained by server
alter table bookings add column if not exists balance_due_date date;                 -- when the balance must be cleared (deposit bookings)
alter table bookings add column if not exists balance_due bigint
  generated always as (greatest(grand_total - amount_paid, 0)) stored;

-- new booking state for "deposit paid, balance pending". Standalone + idempotent.
alter type booking_status add value if not exists 'deposit_paid';

-- distinguish which slice of the total a payment covers
alter table payments add column if not exists kind text not null default 'full'
  check (kind in ('full','deposit','balance'));

-- ---------------------------------------------------------------------------
-- 2. Shop = DEFERRED — no schema. (orders/products/cart added with the shop module later.)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. CMS scope = CORE + CONTENT — per-entity SEO + FAQs
-- ---------------------------------------------------------------------------
create table if not exists seo_meta (
  id                uuid primary key default gen_random_uuid(),
  entity_type       text not null,                       -- 'trek','tour','page','post','home',...
  entity_id         uuid,                                -- null for singletons (e.g. 'home')
  path              text unique,                         -- optional explicit route override
  title             text,
  description       text,
  canonical_url     text,
  og_image_media_id uuid references media(id) on delete set null,
  json_ld           jsonb,
  no_index          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (entity_type, entity_id)
);

create table if not exists faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  category     text,                                     -- 'general','payment','trek',...
  entity_type  text,                                     -- optional: scope to a trek/tour/page
  entity_id    uuid,
  status       content_status not null default 'published',
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_faqs_entity on faqs(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 4. Reviews = VERIFIED — one review per completed booking, moderated
--    (testimonials table stays for admin-curated marketing quotes.)
-- ---------------------------------------------------------------------------
create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  trek_id      uuid references treks(id) on delete cascade,
  booking_id   uuid not null references bookings(id),
  user_id      uuid references profiles(id) on delete set null,
  rating       smallint not null check (rating between 1 and 5),
  title        text,
  body         text,
  status       content_status not null default 'draft',  -- moderation: draft -> published
  verified     boolean not null default true,            -- booking-linked = verified
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (booking_id)                                     -- one review per booking
);
create index if not exists idx_reviews_trek_published on reviews(trek_id) where status = 'published';

-- ---------------------------------------------------------------------------
-- RLS — new tables have it OFF by default; enable + policies (matches 0003 convention)
-- ---------------------------------------------------------------------------
alter table seo_meta enable row level security;
alter table faqs     enable row level security;
alter table reviews  enable row level security;

-- seo_meta is public info (feeds generateMetadata / JSON-LD); staff manage it.
drop policy if exists seo_read  on seo_meta;
create policy seo_read  on seo_meta for select using (true);
drop policy if exists seo_staff on seo_meta;
create policy seo_staff on seo_meta for all using (is_staff()) with check (is_staff());

drop policy if exists faqs_read  on faqs;
create policy faqs_read  on faqs for select using (status = 'published' or is_staff());
drop policy if exists faqs_staff on faqs;
create policy faqs_staff on faqs for all using (is_staff()) with check (is_staff());

-- reviews are submitted via server actions (service role), so public read + staff manage
-- is enough. ponytail: add an author-can-see-own-pending policy only if customers get a
-- self-serve "my reviews" view before moderation.
drop policy if exists reviews_read  on reviews;
create policy reviews_read  on reviews for select using (status = 'published' or is_staff());
drop policy if exists reviews_staff on reviews;
create policy reviews_staff on reviews for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- updated_at triggers for the new tables (matches set_updated_at() convention)
-- ---------------------------------------------------------------------------
drop trigger if exists t_upd on seo_meta;
create trigger t_upd before update on seo_meta for each row execute function set_updated_at();
drop trigger if exists t_upd on faqs;
create trigger t_upd before update on faqs    for each row execute function set_updated_at();
drop trigger if exists t_upd on reviews;
create trigger t_upd before update on reviews for each row execute function set_updated_at();
