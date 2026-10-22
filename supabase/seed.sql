-- Local dev seed. Runs on `supabase db reset` (local only) — NOT on `db push`
-- to a remote, so it never touches production data. Each statement is also
-- guarded to only fill rows that are still empty, so re-running it (or running
-- it against a populated DB) can never overwrite real trek content.
--
-- Demo content for the 0027 trek-detail extras on the seeded harishchandragad
-- trek, so the new detail UI is visible in local dev.

update treks set
  not_to_miss = array[
    'Konkan Kada — the iconic overhanging cliff at sunrise',
    'Kedareshwar cave temple inside the fort',
    'Starry night sky from the plateau, far from city lights',
    'Pachnai village descent through waterfalls in monsoon'
  ],
  suitable_age     = coalesce(nullif(suitable_age, ''), '15 – 55 years'),
  accommodation    = coalesce(nullif(accommodation, ''), 'Cave / tent stay on the fort plateau'),
  fitness_criteria = coalesce(nullif(fitness_criteria, ''), 'Able to walk 8–10 km with a light backpack and climb ~2,000 steps')
where slug = 'harishchandragad-trek'
  and (not_to_miss is null or not_to_miss = '{}');

update itinerary_days set
  trek_distance  = '6 km',
  trek_duration  = '4–5 hrs',
  drive_distance = '180 km',
  drive_duration = '5 hrs',
  altitude_gain  = '900 m',
  altitude_loss  = '0 m',
  meals          = 'Dinner + Breakfast'
where trek_id = (select id from treks where slug = 'harishchandragad-trek') and day_no = 1
  and trek_distance is null;

update itinerary_days set
  trek_distance  = '8 km',
  trek_duration  = '5–6 hrs',
  drive_distance = '180 km',
  drive_duration = '5 hrs',
  altitude_gain  = '524 m',
  altitude_loss  = '900 m',
  meals          = 'Breakfast'
where trek_id = (select id from treks where slug = 'harishchandragad-trek') and day_no = 2
  and trek_distance is null;
