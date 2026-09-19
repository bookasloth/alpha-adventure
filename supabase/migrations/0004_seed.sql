-- ===========================================================================
-- Alpha Adventures — 0004 seed (DEV/reference data, idempotent). Runs last.
-- No fake transactions. Full trek import = separate ETL from src/data/treks.js.
-- ===========================================================================

insert into categories (slug, name, kind, blurb, position) values
  ('sahyadri',    'Sahyadri Treks',      'trek_group', 'Ancient forts, valleys and waterfalls of the Western Ghats.', 1),
  ('himalayan',   'Himalayan Treks',     'trek_group', 'Towering peaks, alpine meadows and high-altitude trails.', 2),
  ('central',     'Central India Treks', 'trek_group', 'Wilderness trails and heritage in the heart of India.', 3),
  ('backpacking', 'Backpacking Trips',   'trek_group', 'Coastal, desert and hill-station circuits across India.', 4),
  ('near-nagpur', 'Trips Near Nagpur',   'trek_group', 'Quick weekend getaways close to Nagpur.', 5),
  ('domestic',    'Domestic Tours',      'tour_type',  'Curated domestic tour packages.', 6),
  ('international','International Tours',  'tour_type',  'Bucket-list international circuits.', 7)
on conflict (slug) do nothing;

insert into tags (slug, name, kind) values
  ('beginner','Beginner','difficulty'), ('moderate','Moderate','difficulty'),
  ('difficult','Difficult','difficulty'), ('fort','Fort','terrain'),
  ('night','Night Trek','season'), ('monsoon','Monsoon','season'),
  ('beach','Beach','terrain'), ('desert','Desert','terrain'),
  ('hill-station','Hill Station','terrain'), ('heritage','Heritage','terrain'),
  ('high-altitude','High Altitude','terrain'), ('weekend','Weekend','audience'),
  ('camping','Camping','terrain'), ('historical','Historical','terrain')
on conflict (slug) do nothing;

insert into site_settings (key, value) values
  ('contact', jsonb_build_object(
      'email','info@alphaadventures.in','phone','+91 8180001597',
      'whatsapp','https://wa.me/918180001597',
      'address','C6, Takshasheela Apartment, N Ambazari Rd, Ram Nagar, Nagpur, Maharashtra 440010',
      'hours','Mon - Sat: 9:00 AM - 7:00 PM')),
  ('social', jsonb_build_object(
      'facebook','https://www.facebook.com/',
      'instagram','https://www.instagram.com/alphaadventuresofficial/',
      'youtube','https://www.youtube.com/')),
  ('stats', jsonb_build_object('rating','4.8/5','trekkers','5000+','experience_years',6))
on conflict (key) do nothing;

insert into treks (slug, title, kind, location, state, summary, difficulty,
                   duration_label, days, nights, base_price, badge, category_id, status, published_at)
select v.slug, v.title, v.kind, v.location, v.state, v.summary, v.difficulty::trek_difficulty,
       v.duration_label, v.days, v.nights, v.base_price, v.badge, c.id, 'published', now()
from (values
  ('harishchandragad-trek','Harishchandragad Trek','trek','Ahmednagar, Maharashtra','Maharashtra',
   'Ancient fort with the famous Konkan Kada cliff and dramatic sunset views.','moderate','02 Days/01 Night',2,1,129900,'Adventure!','sahyadri'),
  ('kalsubai-peak-trek','Kalsubai Peak Trek','trek','Igatpuri, Maharashtra','Maharashtra',
   'The highest peak in Maharashtra at 1,646m with a summit temple.','moderate','01 Day Trek',1,0,79900,'','sahyadri'),
  ('spiti-valley','Spiti Valley','backpacking','Himachal Pradesh','Himachal Pradesh',
   'Cold-desert valley with monasteries, moon-landscapes and high villages.','difficult','08 Days/07 Nights',8,7,2899900,'','backpacking'),
  ('seven-sisters-hill-trek','Seven Sisters Hill Trek','trek','Near Nagpur','Maharashtra',
   'A scenic weekend getaway from Nagpur through rolling hills.','beginner','02 Days/01 Night',2,1,149900,'','near-nagpur')
) as v(slug,title,kind,location,state,summary,difficulty,duration_label,days,nights,base_price,badge,cat_slug)
join categories c on c.slug = v.cat_slug
on conflict (slug) do nothing;

insert into trek_departures (trek_id, start_date, end_date, capacity, status)
select t.id, d.start_date, d.end_date, 30, 'open'
from treks t
join (values
  ('harishchandragad-trek', current_date + 7,  current_date + 8),
  ('harishchandragad-trek', current_date + 14, current_date + 15),
  ('kalsubai-peak-trek',    current_date + 7,  current_date + 7),
  ('seven-sisters-hill-trek', current_date + 10, current_date + 11),
  ('spiti-valley',          current_date + 30, current_date + 37)
) as d(slug, start_date, end_date) on d.slug = t.slug
where not exists (
  select 1 from trek_departures x where x.trek_id = t.id and x.start_date = d.start_date
);
