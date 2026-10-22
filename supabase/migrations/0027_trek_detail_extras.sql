-- 0027 — trek detail extras (SCHEMA ONLY): "not to miss" highlights, brochure,
-- and richer itinerary-day metrics (distance/duration/altitude/meals).
-- (suitable_age / accommodation / fitness_criteria already exist from 0002.)
--
-- Demo/sample content for these columns lives in supabase/seed.sql so it only
-- runs on a local `supabase db reset` — never on a prod `db push`, where it
-- would otherwise overwrite real trek content.

alter table treks add column if not exists not_to_miss  text[] not null default '{}';
alter table treks add column if not exists brochure_url text;

alter table itinerary_days add column if not exists trek_distance  text;
alter table itinerary_days add column if not exists trek_duration  text;
alter table itinerary_days add column if not exists drive_distance text;
alter table itinerary_days add column if not exists drive_duration text;
alter table itinerary_days add column if not exists altitude_gain  text;
alter table itinerary_days add column if not exists altitude_loss  text;
alter table itinerary_days add column if not exists meals          text;
