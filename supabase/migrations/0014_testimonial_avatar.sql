-- Home/testimonial cards store an author avatar as a plain URL (the static data
-- used image paths, not media rows). Public read policy already exists (0003).
alter table testimonials add column if not exists avatar_url text;
