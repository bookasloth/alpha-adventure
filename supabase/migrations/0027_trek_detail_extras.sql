-- 0027 — trek detail extras: "not to miss" highlights, brochure, richer
-- itinerary-day metrics (distance/duration/altitude/meals) + demo seed on the
-- already-seeded harishchandragad trek so the new UI is visible in dev.
-- (suitable_age / accommodation / fitness_criteria already exist from 0002.)

alter table treks add column if not exists not_to_miss  text[] not null default '{}';
alter table treks add column if not exists brochure_url text;

alter table itinerary_days add column if not exists trek_distance  text;
alter table itinerary_days add column if not exists trek_duration  text;
alter table itinerary_days add column if not exists drive_distance text;
alter table itinerary_days add column if not exists drive_duration text;
alter table itinerary_days add column if not exists altitude_gain  text;
alter table itinerary_days add column if not exists altitude_loss  text;
alter table itinerary_days add column if not exists meals          text;

-- Demo data on the seeded trek.
update treks set
  not_to_miss = array[
    'Konkan Kada — the iconic overhanging cliff at sunrise',
    'Kedareshwar cave temple inside the fort',
    'Starry night sky from the plateau, far from city lights',
    'Pachnai village descent through waterfalls in monsoon'
  ],
  suitable_age     = '15 – 55 years',
  accommodation    = 'Cave / tent stay on the fort plateau',
  fitness_criteria = 'Able to walk 8–10 km with a light backpack and climb ~2,000 steps'
where slug = 'harishchandragad-trek';

update itinerary_days set
  trek_distance  = '6 km',
  trek_duration  = '4–5 hrs',
  drive_distance = '180 km',
  drive_duration = '5 hrs',
  altitude_gain  = '900 m',
  altitude_loss  = '0 m',
  meals          = 'Dinner + Breakfast'
where trek_id = (select id from treks where slug = 'harishchandragad-trek') and day_no = 1;

update itinerary_days set
  trek_distance  = '8 km',
  trek_duration  = '5–6 hrs',
  drive_distance = '180 km',
  drive_duration = '5 hrs',
  altitude_gain  = '524 m',
  altitude_loss  = '900 m',
  meals          = 'Breakfast'
where trek_id = (select id from treks where slug = 'harishchandragad-trek') and day_no = 2;
