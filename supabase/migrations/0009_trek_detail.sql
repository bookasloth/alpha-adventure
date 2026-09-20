-- Trek detail content model: rich fields on treks + child tables for the
-- detail page (itinerary, inclusions/exclusions, packages, gallery, trek_faqs).
-- Public (anon) read is allowed for published, non-deleted treks and their
-- children; writes stay service-role only (admin backend later).
-- Money is bigint paise, consistent with the booking engine.

-- -- 1. Extra columns on treks -----------------------------------------------
alter table treks add column if not exists region        text;
alter table treks add column if not exists difficulty     text
  check (difficulty in ('easy','moderate','difficult'));
alter table treks add column if not exists duration_days  smallint;
alter table treks add column if not exists altitude       text;
alter table treks add column if not exists base_camp      text;
alter table treks add column if not exists best_season    text;
alter table treks add column if not exists group_size     text;
alter table treks add column if not exists hero_image     text;
alter table treks add column if not exists overview       text;
alter table treks add column if not exists featured       boolean not null default false;

-- -- 2. Child tables ---------------------------------------------------------
create table if not exists itinerary_days (
  trek_id     uuid not null references treks(id) on delete cascade,
  day_no      smallint not null,
  title       text not null,
  description text,
  image       text,
  primary key (trek_id, day_no)
);

create table if not exists inclusions (
  id      uuid primary key default gen_random_uuid(),
  trek_id uuid not null references treks(id) on delete cascade,
  text    text not null,
  sort    smallint not null default 0
);

create table if not exists exclusions (
  id      uuid primary key default gen_random_uuid(),
  trek_id uuid not null references treks(id) on delete cascade,
  text    text not null,
  sort    smallint not null default 0
);

create table if not exists pricing_packages (
  id         uuid primary key default gen_random_uuid(),
  trek_id    uuid not null references treks(id) on delete cascade,
  name       text not null,
  price      bigint not null,          -- paise
  inclusions text[] not null default '{}',
  cta_label  text not null default 'Book Now',
  sort       smallint not null default 0
);

create table if not exists trek_gallery (
  id         uuid primary key default gen_random_uuid(),
  trek_id    uuid not null references treks(id) on delete cascade,
  image_url  text not null,
  caption    text,
  sort_order smallint not null default 0
);

create table if not exists trek_faqs (
  id       uuid primary key default gen_random_uuid(),
  trek_id  uuid not null references treks(id) on delete cascade,
  question text not null,
  answer   text not null,
  sort     smallint not null default 0
);

create index if not exists idx_itinerary_trek on itinerary_days(trek_id);
create index if not exists idx_inclusions_trek on inclusions(trek_id);
create index if not exists idx_exclusions_trek on exclusions(trek_id);
create index if not exists idx_packages_trek on pricing_packages(trek_id);
create index if not exists idx_gallery_trek on trek_gallery(trek_id);
create index if not exists idx_faqs_trek on trek_faqs(trek_id);

-- -- 3. RLS: public read of detail content -----------------------------------
-- Child rows are readable when their parent trek is published & not deleted.
alter table itinerary_days   enable row level security;
alter table inclusions       enable row level security;
alter table exclusions       enable row level security;
alter table pricing_packages enable row level security;
alter table trek_gallery     enable row level security;
alter table trek_faqs             enable row level security;

drop policy if exists itinerary_days_public_read   on itinerary_days;
drop policy if exists inclusions_public_read        on inclusions;
drop policy if exists exclusions_public_read        on exclusions;
drop policy if exists pricing_packages_public_read  on pricing_packages;
drop policy if exists trek_gallery_public_read      on trek_gallery;
drop policy if exists faqs_public_read              on trek_faqs;

create policy itinerary_days_public_read on itinerary_days for select using (
  exists (select 1 from treks tr where tr.id = itinerary_days.trek_id and tr.status='published' and tr.deleted_at is null));
create policy inclusions_public_read on inclusions for select using (
  exists (select 1 from treks tr where tr.id = inclusions.trek_id and tr.status='published' and tr.deleted_at is null));
create policy exclusions_public_read on exclusions for select using (
  exists (select 1 from treks tr where tr.id = exclusions.trek_id and tr.status='published' and tr.deleted_at is null));
create policy pricing_packages_public_read on pricing_packages for select using (
  exists (select 1 from treks tr where tr.id = pricing_packages.trek_id and tr.status='published' and tr.deleted_at is null));
create policy trek_gallery_public_read on trek_gallery for select using (
  exists (select 1 from treks tr where tr.id = trek_gallery.trek_id and tr.status='published' and tr.deleted_at is null));
create policy faqs_public_read on trek_faqs for select using (
  exists (select 1 from treks tr where tr.id = trek_faqs.trek_id and tr.status='published' and tr.deleted_at is null));

-- -- 4. Seed one complete trek (harishchandragad-trek) -----------------------
update treks set
  region       = 'Sahyadri',
  difficulty   = 'moderate',
  duration_days = 2,
  altitude     = '1424 m (4674 ft)',
  base_camp    = 'Khireshwar Village',
  best_season  = 'June - February',
  group_size   = '15 - 30 trekkers',
  hero_image   = coalesce(hero_image, '/assets/img/home2/trek-harishchandragad.jpg'),
  overview     = 'Harishchandragad is one of the most rewarding forts in the Sahyadri range - a night trek to a sky full of stars, the legendary Konkan Kada cliff at dawn, and the ancient Kedareshwar cave temple. This weekend batch is built for first-time night trekkers and seasoned hikers alike, with experienced local leaders, safety briefings and first-aid support throughout.',
  featured     = true
where slug = 'harishchandragad-trek';

-- Idempotent reseed of children for this trek.
delete from itinerary_days  where trek_id = (select id from treks where slug='harishchandragad-trek');
delete from inclusions       where trek_id = (select id from treks where slug='harishchandragad-trek');
delete from exclusions       where trek_id = (select id from treks where slug='harishchandragad-trek');
delete from pricing_packages where trek_id = (select id from treks where slug='harishchandragad-trek');
delete from trek_gallery     where trek_id = (select id from treks where slug='harishchandragad-trek');
delete from trek_faqs             where trek_id = (select id from treks where slug='harishchandragad-trek');

insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Nagpur to Khireshwar base', 'Board the overnight bus from the pick-up point. Reach Khireshwar village early morning, freshen up and enjoy a hot breakfast before the briefing.', '/assets/img/home2/trek-harishchandragad.jpg'),
  (2, 'Summit push & Konkan Kada', 'Begin the ascent through the Tolar Khind pass. Visit Harishchandreshwar temple and the Kedareshwar cave, then walk out to the dramatic Konkan Kada cliff for sunrise views before descending and heading home.', '/assets/img/home2/trek-andharban.jpg')
) as d(day_no, title, description, image)
where slug='harishchandragad-trek';

insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Return transport from Nagpur pick-up point', 0),
  ('Experienced & certified trek leaders', 1),
  ('Forest / entry permits and charges', 2),
  ('First-aid kit and safety equipment', 3),
  ('1 breakfast on Day 2', 4)
) as x(text, sort) where slug='harishchandragad-trek';

insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='harishchandragad-trek';

insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 129900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 119900, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='harishchandragad-trek';

insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/trek-harishchandragad.jpg', 'Konkan Kada at dawn', 0),
  ('/assets/img/home2/trek-andharban.jpg', 'The forest trail', 1),
  ('/assets/img/home2/trek-kalsubai.jpg', 'Ridge walk', 2),
  ('/assets/img/home2/trek-rajgad.jpg', 'Sunrise from the top', 3),
  ('/assets/img/home2/trek-sinhagad.jpg', 'Kedareshwar cave', 4),
  ('/assets/img/home2/trek-rajgad2.jpg', 'The final climb', 5)
) as g(url, caption, sort) where slug='harishchandragad-trek';

insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is this trek suitable for beginners?', 'Yes. It is graded moderate. If you can walk 5-6 km at a steady pace and climb stairs without much trouble, you can do this trek with our leaders guiding you.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp/torch, some dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve your seat online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='harishchandragad-trek';
