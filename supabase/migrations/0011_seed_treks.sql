-- Auto-generated detail seed for the remaining treks. Idempotent: updates
-- columns and reseeds children per slug; a slug not present in the DB no-ops.
-- Money (package price) is bigint paise. Run after 0009/0010.

-- Rajgad Fort Trek
update treks set region='Sahyadri', difficulty='beginner', duration_days=1, altitude='900 - 1600 m', base_camp='Pune, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img1.jpg'), overview='Former capital of the Maratha Empire. Rajgad is a sprawling fort with multiple plateaus, secret doors and centuries of history waiting to be explored.', featured=coalesce(featured,false) where slug='rajgad-fort-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='rajgad-fort-trek');
delete from inclusions where trek_id=(select id from treks where slug='rajgad-fort-trek');
delete from exclusions where trek_id=(select id from treks where slug='rajgad-fort-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='rajgad-fort-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='rajgad-fort-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='rajgad-fort-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Rajgad Fort Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='rajgad-fort-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='rajgad-fort-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='rajgad-fort-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 89900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 80910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='rajgad-fort-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Rajgad Fort Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Rajgad Fort Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Rajgad Fort Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Rajgad Fort Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Rajgad Fort Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Rajgad Fort Trek 6', 5)
) as g(url, caption, sort) where slug='rajgad-fort-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Rajgad Fort Trek suitable for beginners?', 'It is graded beginner. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='rajgad-fort-trek';

-- Kalsubai Peak Trek
update treks set region='Sahyadri', difficulty='beginner', duration_days=1, altitude='900 - 1600 m', base_camp='Igatpuri, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img2.jpg'), overview='The highest peak in Maharashtra at 1,646m. A rewarding climb with a temple at the summit and panoramic views of the surrounding ranges.', featured=coalesce(featured,false) where slug='kalsubai-peak-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='kalsubai-peak-trek');
delete from inclusions where trek_id=(select id from treks where slug='kalsubai-peak-trek');
delete from exclusions where trek_id=(select id from treks where slug='kalsubai-peak-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='kalsubai-peak-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='kalsubai-peak-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='kalsubai-peak-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Kalsubai Peak Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='kalsubai-peak-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='kalsubai-peak-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='kalsubai-peak-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 79900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 71910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='kalsubai-peak-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Kalsubai Peak Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Kalsubai Peak Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Kalsubai Peak Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Kalsubai Peak Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Kalsubai Peak Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Kalsubai Peak Trek 6', 5)
) as g(url, caption, sort) where slug='kalsubai-peak-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Kalsubai Peak Trek suitable for beginners?', 'It is graded beginner. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='kalsubai-peak-trek';

-- Andharban Jungle Trek
update treks set region='Sahyadri', difficulty='moderate', duration_days=1, altitude='900 - 1600 m', base_camp='Pimpri, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img3.jpg'), overview='A ''dark forest'' descent through dense evergreen woods, waterfalls and valleys - one of the most scenic monsoon trails in the Sahyadris.', featured=coalesce(featured,false) where slug='andharban-jungle-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='andharban-jungle-trek');
delete from inclusions where trek_id=(select id from treks where slug='andharban-jungle-trek');
delete from exclusions where trek_id=(select id from treks where slug='andharban-jungle-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='andharban-jungle-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='andharban-jungle-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='andharban-jungle-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Andharban Jungle Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='andharban-jungle-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='andharban-jungle-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='andharban-jungle-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 99900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 89910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='andharban-jungle-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Andharban Jungle Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Andharban Jungle Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Andharban Jungle Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Andharban Jungle Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Andharban Jungle Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Andharban Jungle Trek 6', 5)
) as g(url, caption, sort) where slug='andharban-jungle-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Andharban Jungle Trek suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='andharban-jungle-trek';

-- Sinhagad Fort Trek
update treks set region='Sahyadri', difficulty='beginner', duration_days=1, altitude='900 - 1600 m', base_camp='Pune, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img4.jpg'), overview='A short, beginner-friendly fort trek packed with history and the famous ''Kanda Bhaji'' at the top. Perfect for a quick weekend escape.', featured=coalesce(featured,false) where slug='sinhagad-fort-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='sinhagad-fort-trek');
delete from inclusions where trek_id=(select id from treks where slug='sinhagad-fort-trek');
delete from exclusions where trek_id=(select id from treks where slug='sinhagad-fort-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='sinhagad-fort-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='sinhagad-fort-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='sinhagad-fort-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Sinhagad Fort Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='sinhagad-fort-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='sinhagad-fort-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='sinhagad-fort-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 59900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 53910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='sinhagad-fort-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Sinhagad Fort Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Sinhagad Fort Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Sinhagad Fort Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Sinhagad Fort Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Sinhagad Fort Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Sinhagad Fort Trek 6', 5)
) as g(url, caption, sort) where slug='sinhagad-fort-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Sinhagad Fort Trek suitable for beginners?', 'It is graded beginner. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='sinhagad-fort-trek';

-- Torna Fort Trek
update treks set region='Sahyadri', difficulty='beginner', duration_days=1, altitude='900 - 1600 m', base_camp='Pune, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img5.jpg'), overview='The first fort captured by Chhatrapati Shivaji Maharaj. Torna offers massive ramparts, water cisterns and sweeping valley views.', featured=coalesce(featured,false) where slug='torna-fort-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='torna-fort-trek');
delete from inclusions where trek_id=(select id from treks where slug='torna-fort-trek');
delete from exclusions where trek_id=(select id from treks where slug='torna-fort-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='torna-fort-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='torna-fort-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='torna-fort-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Torna Fort Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='torna-fort-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='torna-fort-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='torna-fort-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 84900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 76410, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='torna-fort-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Torna Fort Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Torna Fort Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Torna Fort Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Torna Fort Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Torna Fort Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Torna Fort Trek 6', 5)
) as g(url, caption, sort) where slug='torna-fort-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Torna Fort Trek suitable for beginners?', 'It is graded beginner. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='torna-fort-trek';

-- Lohagad Fort Trek
update treks set region='Sahyadri', difficulty='beginner', duration_days=1, altitude='900 - 1600 m', base_camp='Lonavala, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img6.jpg'), overview='An easy, scenic fort trek near Lonavala with the iconic ''Vinchu Kata'' (scorpion tail) formation. Great for families and first-timers.', featured=coalesce(featured,false) where slug='lohagad-fort-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='lohagad-fort-trek');
delete from inclusions where trek_id=(select id from treks where slug='lohagad-fort-trek');
delete from exclusions where trek_id=(select id from treks where slug='lohagad-fort-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='lohagad-fort-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='lohagad-fort-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='lohagad-fort-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Lohagad Fort Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='lohagad-fort-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='lohagad-fort-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='lohagad-fort-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 69900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 62910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='lohagad-fort-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Lohagad Fort Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Lohagad Fort Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Lohagad Fort Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Lohagad Fort Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Lohagad Fort Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Lohagad Fort Trek 6', 5)
) as g(url, caption, sort) where slug='lohagad-fort-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Lohagad Fort Trek suitable for beginners?', 'It is graded beginner. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='lohagad-fort-trek';

-- Visapur Fort Trek
update treks set region='Sahyadri', difficulty='beginner', duration_days=1, altitude='900 - 1600 m', base_camp='Lonavala, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img7.jpg'), overview='A monsoon favourite with gushing waterfalls cascading over the fort walls. The twin of Lohagad, bigger and bolder.', featured=coalesce(featured,false) where slug='visapur-fort-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='visapur-fort-trek');
delete from inclusions where trek_id=(select id from treks where slug='visapur-fort-trek');
delete from exclusions where trek_id=(select id from treks where slug='visapur-fort-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='visapur-fort-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='visapur-fort-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='visapur-fort-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Visapur Fort Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='visapur-fort-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='visapur-fort-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='visapur-fort-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 74900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 67410, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='visapur-fort-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Visapur Fort Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Visapur Fort Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Visapur Fort Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Visapur Fort Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Visapur Fort Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Visapur Fort Trek 6', 5)
) as g(url, caption, sort) where slug='visapur-fort-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Visapur Fort Trek suitable for beginners?', 'It is graded beginner. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='visapur-fort-trek';

-- Ratangad Fort Trek
update treks set region='Sahyadri', difficulty='beginner', duration_days=1, altitude='900 - 1600 m', base_camp='Bhandardara, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img1.jpg'), overview='A 400-year-old fort famous for its natural rock-carved ''Needle Hole'' (Ratangad means jewel of the fort) and views of Bhandardara dam.', featured=coalesce(featured,false) where slug='ratangad-fort-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='ratangad-fort-trek');
delete from inclusions where trek_id=(select id from treks where slug='ratangad-fort-trek');
delete from exclusions where trek_id=(select id from treks where slug='ratangad-fort-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='ratangad-fort-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='ratangad-fort-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='ratangad-fort-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Ratangad Fort Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='ratangad-fort-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='ratangad-fort-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='ratangad-fort-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 89900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 80910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='ratangad-fort-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Ratangad Fort Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Ratangad Fort Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Ratangad Fort Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Ratangad Fort Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Ratangad Fort Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Ratangad Fort Trek 6', 5)
) as g(url, caption, sort) where slug='ratangad-fort-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Ratangad Fort Trek suitable for beginners?', 'It is graded beginner. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='ratangad-fort-trek';

-- Harihar Fort Trek
update treks set region='Sahyadri', difficulty='moderate', duration_days=1, altitude='900 - 1600 m', base_camp='Nashik, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img2.jpg'), overview='Famed for its nearly vertical 80-degree rock-cut staircase - a thrilling climb for experienced trekkers seeking an adrenaline rush.', featured=coalesce(featured,false) where slug='harihar-fort-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='harihar-fort-trek');
delete from inclusions where trek_id=(select id from treks where slug='harihar-fort-trek');
delete from exclusions where trek_id=(select id from treks where slug='harihar-fort-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='harihar-fort-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='harihar-fort-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='harihar-fort-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Harihar Fort Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='harihar-fort-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='harihar-fort-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='harihar-fort-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 109900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 98910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='harihar-fort-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Harihar Fort Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Harihar Fort Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Harihar Fort Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Harihar Fort Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Harihar Fort Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Harihar Fort Trek 6', 5)
) as g(url, caption, sort) where slug='harihar-fort-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Harihar Fort Trek suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='harihar-fort-trek';

-- Sinhagad Sunset Trek
update treks set region='Sahyadri', difficulty='beginner', duration_days=1, altitude='900 - 1600 m', base_camp='Pune, Maharashtra', best_season='June - February', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img3.jpg'), overview='A serene evening climb to catch the golden sunset from Sinhagad, followed by stars and local snacks at the top.', featured=coalesce(featured,false) where slug='sinhagad-sunset-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='sinhagad-sunset-trek');
delete from inclusions where trek_id=(select id from treks where slug='sinhagad-sunset-trek');
delete from exclusions where trek_id=(select id from treks where slug='sinhagad-sunset-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='sinhagad-sunset-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='sinhagad-sunset-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='sinhagad-sunset-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Sinhagad Sunset Trek - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='sinhagad-sunset-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='sinhagad-sunset-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='sinhagad-sunset-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 64900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 58410, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='sinhagad-sunset-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Sinhagad Sunset Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Sinhagad Sunset Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Sinhagad Sunset Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Sinhagad Sunset Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Sinhagad Sunset Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Sinhagad Sunset Trek 6', 5)
) as g(url, caption, sort) where slug='sinhagad-sunset-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Sinhagad Sunset Trek suitable for beginners?', 'It is graded beginner. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='sinhagad-sunset-trek';

-- Maharashtra Himalayan Foothills
update treks set region='Himalayan', difficulty='difficult', duration_days=5, altitude='3000 m+', base_camp='Western Himalayan Foothills', best_season='March - June', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img4.jpg'), overview='Explore the western Himalayan foothills with alpine meadows, pine forests and high-altitude villages on curated multi-day circuits.', featured=coalesce(featured,false) where slug='himalayan-maharashtra';
delete from itinerary_days where trek_id=(select id from treks where slug='himalayan-maharashtra');
delete from inclusions where trek_id=(select id from treks where slug='himalayan-maharashtra');
delete from exclusions where trek_id=(select id from treks where slug='himalayan-maharashtra');
delete from pricing_packages where trek_id=(select id from treks where slug='himalayan-maharashtra');
delete from trek_gallery where trek_id=(select id from treks where slug='himalayan-maharashtra');
delete from trek_faqs where trek_id=(select id from treks where slug='himalayan-maharashtra');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Western Himalayan Foothills base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Himalayan landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Himalayan landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Trek day 4', 'A full day on the trail through the Himalayan landscape.', '/assets/img/home2/destination-img5.jpg'),
  (5, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img6.jpg')
) as d(day_no, title, description, image) where slug='himalayan-maharashtra';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='himalayan-maharashtra';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='himalayan-maharashtra';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1899900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1709910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='himalayan-maharashtra';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Maharashtra Himalayan Foothills 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Maharashtra Himalayan Foothills 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Maharashtra Himalayan Foothills 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Maharashtra Himalayan Foothills 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Maharashtra Himalayan Foothills 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Maharashtra Himalayan Foothills 6', 5)
) as g(url, caption, sort) where slug='himalayan-maharashtra';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Maharashtra Himalayan Foothills suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='himalayan-maharashtra';

-- Gujarat Mountain Trails
update treks set region='Himalayan', difficulty='difficult', duration_days=4, altitude='3000 m+', base_camp='Gujarat', best_season='March - June', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img5.jpg'), overview='Gujarat''s lesser-known mountain trails blend tribal culture, sacred hills and green escarpments away from the crowds.', featured=coalesce(featured,false) where slug='himalayan-gujarat';
delete from itinerary_days where trek_id=(select id from treks where slug='himalayan-gujarat');
delete from inclusions where trek_id=(select id from treks where slug='himalayan-gujarat');
delete from exclusions where trek_id=(select id from treks where slug='himalayan-gujarat');
delete from pricing_packages where trek_id=(select id from treks where slug='himalayan-gujarat');
delete from trek_gallery where trek_id=(select id from treks where slug='himalayan-gujarat');
delete from trek_faqs where trek_id=(select id from treks where slug='himalayan-gujarat');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Gujarat base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Himalayan landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Himalayan landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img5.jpg')
) as d(day_no, title, description, image) where slug='himalayan-gujarat';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='himalayan-gujarat';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='himalayan-gujarat';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1499900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1349910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='himalayan-gujarat';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Gujarat Mountain Trails 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Gujarat Mountain Trails 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Gujarat Mountain Trails 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Gujarat Mountain Trails 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Gujarat Mountain Trails 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Gujarat Mountain Trails 6', 5)
) as g(url, caption, sort) where slug='himalayan-gujarat';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Gujarat Mountain Trails suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='himalayan-gujarat';

-- Madhya Pradesh Central Highland Treks
update treks set region='Himalayan', difficulty='difficult', duration_days=4, altitude='3000 m+', base_camp='Madhya Pradesh', best_season='March - June', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img6.jpg'), overview='Central highland treks through the Satpura and Vindhya ranges - forests, waterfalls and ancient heritage in the heart of India.', featured=coalesce(featured,false) where slug='himalayan-madhya-pradesh';
delete from itinerary_days where trek_id=(select id from treks where slug='himalayan-madhya-pradesh');
delete from inclusions where trek_id=(select id from treks where slug='himalayan-madhya-pradesh');
delete from exclusions where trek_id=(select id from treks where slug='himalayan-madhya-pradesh');
delete from pricing_packages where trek_id=(select id from treks where slug='himalayan-madhya-pradesh');
delete from trek_gallery where trek_id=(select id from treks where slug='himalayan-madhya-pradesh');
delete from trek_faqs where trek_id=(select id from treks where slug='himalayan-madhya-pradesh');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Madhya Pradesh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Himalayan landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Himalayan landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img5.jpg')
) as d(day_no, title, description, image) where slug='himalayan-madhya-pradesh';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='himalayan-madhya-pradesh';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='himalayan-madhya-pradesh';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1399900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1259910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='himalayan-madhya-pradesh';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Madhya Pradesh Central Highland Treks 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Madhya Pradesh Central Highland Treks 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Madhya Pradesh Central Highland Treks 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Madhya Pradesh Central Highland Treks 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Madhya Pradesh Central Highland Treks 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Madhya Pradesh Central Highland Treks 6', 5)
) as g(url, caption, sort) where slug='himalayan-madhya-pradesh';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Madhya Pradesh Central Highland Treks suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='himalayan-madhya-pradesh';

-- Pachmarhi Trek
update treks set region='Central India', difficulty='moderate', duration_days=3, altitude='900 - 1600 m', base_camp='Satpura, Madhya Pradesh', best_season='October - March', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img7.jpg'), overview='The Queen of Satpura - waterfalls, ancient caves (Buddhist rock shelters) and the highest point in MP, Dhupgarh.', featured=coalesce(featured,false) where slug='pachmarhi-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='pachmarhi-trek');
delete from inclusions where trek_id=(select id from treks where slug='pachmarhi-trek');
delete from exclusions where trek_id=(select id from treks where slug='pachmarhi-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='pachmarhi-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='pachmarhi-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='pachmarhi-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Satpura, Madhya Pradesh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Central India landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img4.jpg')
) as d(day_no, title, description, image) where slug='pachmarhi-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='pachmarhi-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='pachmarhi-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 999900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 899910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='pachmarhi-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Pachmarhi Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Pachmarhi Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Pachmarhi Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Pachmarhi Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Pachmarhi Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Pachmarhi Trek 6', 5)
) as g(url, caption, sort) where slug='pachmarhi-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Pachmarhi Trek suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='pachmarhi-trek';

-- Amarkantak Trek
update treks set region='Central India', difficulty='moderate', duration_days=3, altitude='900 - 1600 m', base_camp='Madhya Pradesh', best_season='October - March', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img1.jpg'), overview='The source of the Narmada and Sone rivers, set amid misty hills, temples and dense forests - a spiritual and scenic trek.', featured=coalesce(featured,false) where slug='amarkantak-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='amarkantak-trek');
delete from inclusions where trek_id=(select id from treks where slug='amarkantak-trek');
delete from exclusions where trek_id=(select id from treks where slug='amarkantak-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='amarkantak-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='amarkantak-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='amarkantak-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Madhya Pradesh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Central India landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img4.jpg')
) as d(day_no, title, description, image) where slug='amarkantak-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='amarkantak-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='amarkantak-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 949900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 854910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='amarkantak-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Amarkantak Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Amarkantak Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Amarkantak Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Amarkantak Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Amarkantak Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Amarkantak Trek 6', 5)
) as g(url, caption, sort) where slug='amarkantak-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Amarkantak Trek suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='amarkantak-trek';

-- Malvan-Tarkarli
update treks set region='Backpacking', difficulty='difficult', duration_days=4, altitude='3000 m+', base_camp='Maharashtra', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img2.jpg'), overview='Crystal-clear waters, scuba diving, Sindhudurg fort and beach shacks - the perfect coastal backpacking escape.', featured=coalesce(featured,false) where slug='malvan-tarkarli';
delete from itinerary_days where trek_id=(select id from treks where slug='malvan-tarkarli');
delete from inclusions where trek_id=(select id from treks where slug='malvan-tarkarli');
delete from exclusions where trek_id=(select id from treks where slug='malvan-tarkarli');
delete from pricing_packages where trek_id=(select id from treks where slug='malvan-tarkarli');
delete from trek_gallery where trek_id=(select id from treks where slug='malvan-tarkarli');
delete from trek_faqs where trek_id=(select id from treks where slug='malvan-tarkarli');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Maharashtra base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img5.jpg')
) as d(day_no, title, description, image) where slug='malvan-tarkarli';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='malvan-tarkarli';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='malvan-tarkarli';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1199900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1079910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='malvan-tarkarli';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Malvan-Tarkarli 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Malvan-Tarkarli 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Malvan-Tarkarli 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Malvan-Tarkarli 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Malvan-Tarkarli 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Malvan-Tarkarli 6', 5)
) as g(url, caption, sort) where slug='malvan-tarkarli';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Malvan-Tarkarli suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='malvan-tarkarli';

-- Mahabaleshwar
update treks set region='Backpacking', difficulty='moderate', duration_days=3, altitude='900 - 1600 m', base_camp='Maharashtra', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img3.jpg'), overview='Strawberry farms, panoramic viewpoints and the source of the Krishna river - a classic hill-station getaway.', featured=coalesce(featured,false) where slug='mahabaleshwar';
delete from itinerary_days where trek_id=(select id from treks where slug='mahabaleshwar');
delete from inclusions where trek_id=(select id from treks where slug='mahabaleshwar');
delete from exclusions where trek_id=(select id from treks where slug='mahabaleshwar');
delete from pricing_packages where trek_id=(select id from treks where slug='mahabaleshwar');
delete from trek_gallery where trek_id=(select id from treks where slug='mahabaleshwar');
delete from trek_faqs where trek_id=(select id from treks where slug='mahabaleshwar');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Maharashtra base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img4.jpg')
) as d(day_no, title, description, image) where slug='mahabaleshwar';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='mahabaleshwar';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='mahabaleshwar';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 899900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 809910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='mahabaleshwar';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Mahabaleshwar 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Mahabaleshwar 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Mahabaleshwar 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Mahabaleshwar 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Mahabaleshwar 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Mahabaleshwar 6', 5)
) as g(url, caption, sort) where slug='mahabaleshwar';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Mahabaleshwar suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='mahabaleshwar';

-- Lavasa
update treks set region='Backpacking', difficulty='moderate', duration_days=2, altitude='900 - 1600 m', base_camp='Maharashtra', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img4.jpg'), overview='India''s planned hill city by the lake - boating, cycling trails and a relaxed weekend vibe.', featured=coalesce(featured,false) where slug='lavasa';
delete from itinerary_days where trek_id=(select id from treks where slug='lavasa');
delete from inclusions where trek_id=(select id from treks where slug='lavasa');
delete from exclusions where trek_id=(select id from treks where slug='lavasa');
delete from pricing_packages where trek_id=(select id from treks where slug='lavasa');
delete from trek_gallery where trek_id=(select id from treks where slug='lavasa');
delete from trek_faqs where trek_id=(select id from treks where slug='lavasa');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Maharashtra base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img3.jpg')
) as d(day_no, title, description, image) where slug='lavasa';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='lavasa';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='lavasa';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 699900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 629910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='lavasa';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Lavasa 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Lavasa 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Lavasa 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Lavasa 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Lavasa 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Lavasa 6', 5)
) as g(url, caption, sort) where slug='lavasa';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Lavasa suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='lavasa';

-- Rann of Kutch
update treks set region='Backpacking', difficulty='difficult', duration_days=4, altitude='3000 m+', base_camp='Gujarat', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img5.jpg'), overview='The vast white salt desert of Kutch - full-moon nights, mirror reflections and the vibrant Rann Utsav.', featured=coalesce(featured,false) where slug='rann-of-kutch';
delete from itinerary_days where trek_id=(select id from treks where slug='rann-of-kutch');
delete from inclusions where trek_id=(select id from treks where slug='rann-of-kutch');
delete from exclusions where trek_id=(select id from treks where slug='rann-of-kutch');
delete from pricing_packages where trek_id=(select id from treks where slug='rann-of-kutch');
delete from trek_gallery where trek_id=(select id from treks where slug='rann-of-kutch');
delete from trek_faqs where trek_id=(select id from treks where slug='rann-of-kutch');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Gujarat base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img5.jpg')
) as d(day_no, title, description, image) where slug='rann-of-kutch';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='rann-of-kutch';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='rann-of-kutch';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1399900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1259910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='rann-of-kutch';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Rann of Kutch 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Rann of Kutch 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Rann of Kutch 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Rann of Kutch 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Rann of Kutch 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Rann of Kutch 6', 5)
) as g(url, caption, sort) where slug='rann-of-kutch';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Rann of Kutch suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='rann-of-kutch';

-- Saputara
update treks set region='Backpacking', difficulty='moderate', duration_days=3, altitude='900 - 1600 m', base_camp='Gujarat', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img6.jpg'), overview='Gujarat''s only hill station - lush forests, the Saputara lake and tribal culture in the Western Ghats'' northern edge.', featured=coalesce(featured,false) where slug='saputara';
delete from itinerary_days where trek_id=(select id from treks where slug='saputara');
delete from inclusions where trek_id=(select id from treks where slug='saputara');
delete from exclusions where trek_id=(select id from treks where slug='saputara');
delete from pricing_packages where trek_id=(select id from treks where slug='saputara');
delete from trek_gallery where trek_id=(select id from treks where slug='saputara');
delete from trek_faqs where trek_id=(select id from treks where slug='saputara');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Gujarat base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img4.jpg')
) as d(day_no, title, description, image) where slug='saputara';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='saputara';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='saputara';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 999900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 899910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='saputara';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Saputara 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Saputara 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Saputara 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Saputara 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Saputara 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Saputara 6', 5)
) as g(url, caption, sort) where slug='saputara';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Saputara suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='saputara';

-- Diu
update treks set region='Backpacking', difficulty='moderate', duration_days=3, altitude='900 - 1600 m', base_camp='Gujarat', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img7.jpg'), overview='A peaceful island fort, Portuguese heritage and quiet beaches - a laid-back coastal break.', featured=coalesce(featured,false) where slug='diu';
delete from itinerary_days where trek_id=(select id from treks where slug='diu');
delete from inclusions where trek_id=(select id from treks where slug='diu');
delete from exclusions where trek_id=(select id from treks where slug='diu');
delete from pricing_packages where trek_id=(select id from treks where slug='diu');
delete from trek_gallery where trek_id=(select id from treks where slug='diu');
delete from trek_faqs where trek_id=(select id from treks where slug='diu');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Gujarat base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img4.jpg')
) as d(day_no, title, description, image) where slug='diu';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='diu';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='diu';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 949900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 854910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='diu';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Diu 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Diu 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Diu 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Diu 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Diu 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Diu 6', 5)
) as g(url, caption, sort) where slug='diu';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Diu suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='diu';

-- Orchha
update treks set region='Backpacking', difficulty='moderate', duration_days=3, altitude='900 - 1600 m', base_camp='Madhya Pradesh', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img1.jpg'), overview='Medieval Bundela architecture, riverside cenotaphs and the Betwa river - a heritage backpacking gem.', featured=coalesce(featured,false) where slug='orchha';
delete from itinerary_days where trek_id=(select id from treks where slug='orchha');
delete from inclusions where trek_id=(select id from treks where slug='orchha');
delete from exclusions where trek_id=(select id from treks where slug='orchha');
delete from pricing_packages where trek_id=(select id from treks where slug='orchha');
delete from trek_gallery where trek_id=(select id from treks where slug='orchha');
delete from trek_faqs where trek_id=(select id from treks where slug='orchha');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Madhya Pradesh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img4.jpg')
) as d(day_no, title, description, image) where slug='orchha';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='orchha';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='orchha';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 899900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 809910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='orchha';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Orchha 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Orchha 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Orchha 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Orchha 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Orchha 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Orchha 6', 5)
) as g(url, caption, sort) where slug='orchha';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Orchha suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='orchha';

-- Khajuraho
update treks set region='Backpacking', difficulty='moderate', duration_days=3, altitude='900 - 1600 m', base_camp='Madhya Pradesh', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img2.jpg'), overview='World-famous temple sculptures, a UNESCO site and a window into India''s artistic heritage.', featured=coalesce(featured,false) where slug='khajuraho';
delete from itinerary_days where trek_id=(select id from treks where slug='khajuraho');
delete from inclusions where trek_id=(select id from treks where slug='khajuraho');
delete from exclusions where trek_id=(select id from treks where slug='khajuraho');
delete from pricing_packages where trek_id=(select id from treks where slug='khajuraho');
delete from trek_gallery where trek_id=(select id from treks where slug='khajuraho');
delete from trek_faqs where trek_id=(select id from treks where slug='khajuraho');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Madhya Pradesh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img4.jpg')
) as d(day_no, title, description, image) where slug='khajuraho';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='khajuraho';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='khajuraho';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 949900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 854910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='khajuraho';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Khajuraho 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Khajuraho 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Khajuraho 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Khajuraho 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Khajuraho 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Khajuraho 6', 5)
) as g(url, caption, sort) where slug='khajuraho';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Khajuraho suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='khajuraho';

-- Jodhpur-Jaisalmer
update treks set region='Backpacking', difficulty='difficult', duration_days=6, altitude='3000 m+', base_camp='Rajasthan', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img3.jpg'), overview='The Blue City and the Golden Fort - desert camps, dunes, forts and timeless Rajputana heritage.', featured=coalesce(featured,false) where slug='jodhpur-jaisalmer';
delete from itinerary_days where trek_id=(select id from treks where slug='jodhpur-jaisalmer');
delete from inclusions where trek_id=(select id from treks where slug='jodhpur-jaisalmer');
delete from exclusions where trek_id=(select id from treks where slug='jodhpur-jaisalmer');
delete from pricing_packages where trek_id=(select id from treks where slug='jodhpur-jaisalmer');
delete from trek_gallery where trek_id=(select id from treks where slug='jodhpur-jaisalmer');
delete from trek_faqs where trek_id=(select id from treks where slug='jodhpur-jaisalmer');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Rajasthan base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Trek day 4', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img5.jpg'),
  (5, 'Trek day 5', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img6.jpg'),
  (6, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img7.jpg')
) as d(day_no, title, description, image) where slug='jodhpur-jaisalmer';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='jodhpur-jaisalmer';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='jodhpur-jaisalmer';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1999900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1799910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='jodhpur-jaisalmer';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Jodhpur-Jaisalmer 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Jodhpur-Jaisalmer 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Jodhpur-Jaisalmer 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Jodhpur-Jaisalmer 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Jodhpur-Jaisalmer 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Jodhpur-Jaisalmer 6', 5)
) as g(url, caption, sort) where slug='jodhpur-jaisalmer';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Jodhpur-Jaisalmer suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='jodhpur-jaisalmer';

-- Udaipur
update treks set region='Backpacking', difficulty='difficult', duration_days=4, altitude='3000 m+', base_camp='Rajasthan', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img4.jpg'), overview='The City of Lakes and Palaces - boat rides on Lake Pichola and the grand City Palace.', featured=coalesce(featured,false) where slug='udaipur';
delete from itinerary_days where trek_id=(select id from treks where slug='udaipur');
delete from inclusions where trek_id=(select id from treks where slug='udaipur');
delete from exclusions where trek_id=(select id from treks where slug='udaipur');
delete from pricing_packages where trek_id=(select id from treks where slug='udaipur');
delete from trek_gallery where trek_id=(select id from treks where slug='udaipur');
delete from trek_faqs where trek_id=(select id from treks where slug='udaipur');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Rajasthan base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img5.jpg')
) as d(day_no, title, description, image) where slug='udaipur';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='udaipur';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='udaipur';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1499900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1349910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='udaipur';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Udaipur 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Udaipur 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Udaipur 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Udaipur 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Udaipur 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Udaipur 6', 5)
) as g(url, caption, sort) where slug='udaipur';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Udaipur suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='udaipur';

-- Jaipur
update treks set region='Backpacking', difficulty='difficult', duration_days=4, altitude='3000 m+', base_camp='Rajasthan', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img5.jpg'), overview='The Pink City - Amber Fort, Hawa Mahal and bustling bazaars packed with colour and history.', featured=coalesce(featured,false) where slug='jaipur';
delete from itinerary_days where trek_id=(select id from treks where slug='jaipur');
delete from inclusions where trek_id=(select id from treks where slug='jaipur');
delete from exclusions where trek_id=(select id from treks where slug='jaipur');
delete from pricing_packages where trek_id=(select id from treks where slug='jaipur');
delete from trek_gallery where trek_id=(select id from treks where slug='jaipur');
delete from trek_faqs where trek_id=(select id from treks where slug='jaipur');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Rajasthan base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img5.jpg')
) as d(day_no, title, description, image) where slug='jaipur';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='jaipur';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='jaipur';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1399900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1259910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='jaipur';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Jaipur 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Jaipur 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Jaipur 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Jaipur 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Jaipur 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Jaipur 6', 5)
) as g(url, caption, sort) where slug='jaipur';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Jaipur suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='jaipur';

-- Spiti Valley
update treks set region='Backpacking', difficulty='difficult', duration_days=8, altitude='3000 m+', base_camp='Himachal Pradesh', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img6.jpg'), overview='A cold-desert mountain valley with monasteries, moon-landscapes and surreal high-altitude villages.', featured=coalesce(featured,false) where slug='spiti-valley';
delete from itinerary_days where trek_id=(select id from treks where slug='spiti-valley');
delete from inclusions where trek_id=(select id from treks where slug='spiti-valley');
delete from exclusions where trek_id=(select id from treks where slug='spiti-valley');
delete from pricing_packages where trek_id=(select id from treks where slug='spiti-valley');
delete from trek_gallery where trek_id=(select id from treks where slug='spiti-valley');
delete from trek_faqs where trek_id=(select id from treks where slug='spiti-valley');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Himachal Pradesh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Trek day 4', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img5.jpg'),
  (5, 'Trek day 5', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img6.jpg'),
  (6, 'Trek day 6', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img7.jpg'),
  (7, 'Trek day 7', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img1.jpg'),
  (8, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='spiti-valley';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='spiti-valley';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='spiti-valley';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 2899900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 2609910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='spiti-valley';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Spiti Valley 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Spiti Valley 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Spiti Valley 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Spiti Valley 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Spiti Valley 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Spiti Valley 6', 5)
) as g(url, caption, sort) where slug='spiti-valley';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Spiti Valley suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='spiti-valley';

-- Kasol
update treks set region='Backpacking', difficulty='difficult', duration_days=5, altitude='3000 m+', base_camp='Himachal Pradesh', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img7.jpg'), overview='Mini Israel of India - riverside cafes, Parvati valley treks and a chilled backpacker vibe.', featured=coalesce(featured,false) where slug='kasol';
delete from itinerary_days where trek_id=(select id from treks where slug='kasol');
delete from inclusions where trek_id=(select id from treks where slug='kasol');
delete from exclusions where trek_id=(select id from treks where slug='kasol');
delete from pricing_packages where trek_id=(select id from treks where slug='kasol');
delete from trek_gallery where trek_id=(select id from treks where slug='kasol');
delete from trek_faqs where trek_id=(select id from treks where slug='kasol');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Himachal Pradesh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Trek day 4', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img5.jpg'),
  (5, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img6.jpg')
) as d(day_no, title, description, image) where slug='kasol';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='kasol';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='kasol';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1699900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1529910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='kasol';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Kasol 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Kasol 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Kasol 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Kasol 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Kasol 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Kasol 6', 5)
) as g(url, caption, sort) where slug='kasol';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Kasol suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='kasol';

-- Manali
update treks set region='Backpacking', difficulty='difficult', duration_days=5, altitude='3000 m+', base_camp='Himachal Pradesh', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img1.jpg'), overview='The adventure capital of Himachal - snow points, Solang valley and gateway to higher Himalayan treks.', featured=coalesce(featured,false) where slug='manali';
delete from itinerary_days where trek_id=(select id from treks where slug='manali');
delete from inclusions where trek_id=(select id from treks where slug='manali');
delete from exclusions where trek_id=(select id from treks where slug='manali');
delete from pricing_packages where trek_id=(select id from treks where slug='manali');
delete from trek_gallery where trek_id=(select id from treks where slug='manali');
delete from trek_faqs where trek_id=(select id from treks where slug='manali');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Himachal Pradesh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Trek day 4', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img5.jpg'),
  (5, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img6.jpg')
) as d(day_no, title, description, image) where slug='manali';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='manali';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='manali';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 1799900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 1619910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='manali';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Manali 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Manali 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Manali 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Manali 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Manali 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Manali 6', 5)
) as g(url, caption, sort) where slug='manali';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Manali suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='manali';

-- Pangong Lake
update treks set region='Backpacking', difficulty='difficult', duration_days=7, altitude='3000 m+', base_camp='Ladakh', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img2.jpg'), overview='The colour-changing high-altitude lake that shifts from blue to green - a Ladakh icon.', featured=coalesce(featured,false) where slug='pangong';
delete from itinerary_days where trek_id=(select id from treks where slug='pangong');
delete from inclusions where trek_id=(select id from treks where slug='pangong');
delete from exclusions where trek_id=(select id from treks where slug='pangong');
delete from pricing_packages where trek_id=(select id from treks where slug='pangong');
delete from trek_gallery where trek_id=(select id from treks where slug='pangong');
delete from trek_faqs where trek_id=(select id from treks where slug='pangong');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Ladakh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Trek day 4', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img5.jpg'),
  (5, 'Trek day 5', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img6.jpg'),
  (6, 'Trek day 6', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img7.jpg'),
  (7, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img1.jpg')
) as d(day_no, title, description, image) where slug='pangong';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='pangong';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='pangong';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 3299900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 2969910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='pangong';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Pangong Lake 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Pangong Lake 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Pangong Lake 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Pangong Lake 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Pangong Lake 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Pangong Lake 6', 5)
) as g(url, caption, sort) where slug='pangong';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Pangong Lake suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='pangong';

-- Nubra Valley
update treks set region='Backpacking', difficulty='difficult', duration_days=7, altitude='3000 m+', base_camp='Ladakh', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img3.jpg'), overview='The valley of flowers, Bactrian (double-humped) camels and the sand dunes of Hunder.', featured=coalesce(featured,false) where slug='nubra-valley';
delete from itinerary_days where trek_id=(select id from treks where slug='nubra-valley');
delete from inclusions where trek_id=(select id from treks where slug='nubra-valley');
delete from exclusions where trek_id=(select id from treks where slug='nubra-valley');
delete from pricing_packages where trek_id=(select id from treks where slug='nubra-valley');
delete from trek_gallery where trek_id=(select id from treks where slug='nubra-valley');
delete from trek_faqs where trek_id=(select id from treks where slug='nubra-valley');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Ladakh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Trek day 4', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img5.jpg'),
  (5, 'Trek day 5', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img6.jpg'),
  (6, 'Trek day 6', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img7.jpg'),
  (7, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img1.jpg')
) as d(day_no, title, description, image) where slug='nubra-valley';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='nubra-valley';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='nubra-valley';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 3499900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 3149910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='nubra-valley';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Nubra Valley 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Nubra Valley 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Nubra Valley 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Nubra Valley 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Nubra Valley 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Nubra Valley 6', 5)
) as g(url, caption, sort) where slug='nubra-valley';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Nubra Valley suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='nubra-valley';

-- Leh
update treks set region='Backpacking', difficulty='difficult', duration_days=6, altitude='3000 m+', base_camp='Ladakh', best_season='October - May', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img4.jpg'), overview='The gateway to Ladakh - monasteries, palaces and acclimatisation rides to Khardung La.', featured=coalesce(featured,false) where slug='leh';
delete from itinerary_days where trek_id=(select id from treks where slug='leh');
delete from inclusions where trek_id=(select id from treks where slug='leh');
delete from exclusions where trek_id=(select id from treks where slug='leh');
delete from pricing_packages where trek_id=(select id from treks where slug='leh');
delete from trek_gallery where trek_id=(select id from treks where slug='leh');
delete from trek_faqs where trek_id=(select id from treks where slug='leh');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Ladakh base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Trek day 2', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img3.jpg'),
  (3, 'Trek day 3', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img4.jpg'),
  (4, 'Trek day 4', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img5.jpg'),
  (5, 'Trek day 5', 'A full day on the trail through the Backpacking landscape.', '/assets/img/home2/destination-img6.jpg'),
  (6, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img7.jpg')
) as d(day_no, title, description, image) where slug='leh';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='leh';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='leh';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 2999900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 2699910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='leh';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Leh 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Leh 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Leh 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Leh 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Leh 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Leh 6', 5)
) as g(url, caption, sort) where slug='leh';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Leh suitable for beginners?', 'It is graded difficult. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='leh';

-- Seven Sisters Hill Trek
update treks set region='India', difficulty='moderate', duration_days=2, altitude='900 - 1600 m', base_camp='Near Nagpur', best_season='October - March', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img5.jpg'), overview='A scenic weekend getaway from Nagpur through rolling hills and tribal villages - perfect for a quick reset.', featured=coalesce(featured,false) where slug='seven-sisters-hill-trek';
delete from itinerary_days where trek_id=(select id from treks where slug='seven-sisters-hill-trek');
delete from inclusions where trek_id=(select id from treks where slug='seven-sisters-hill-trek');
delete from exclusions where trek_id=(select id from treks where slug='seven-sisters-hill-trek');
delete from pricing_packages where trek_id=(select id from treks where slug='seven-sisters-hill-trek');
delete from trek_gallery where trek_id=(select id from treks where slug='seven-sisters-hill-trek');
delete from trek_faqs where trek_id=(select id from treks where slug='seven-sisters-hill-trek');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Near Nagpur base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img3.jpg')
) as d(day_no, title, description, image) where slug='seven-sisters-hill-trek';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='seven-sisters-hill-trek';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='seven-sisters-hill-trek';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 149900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 134910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='seven-sisters-hill-trek';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Seven Sisters Hill Trek 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Seven Sisters Hill Trek 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Seven Sisters Hill Trek 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Seven Sisters Hill Trek 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Seven Sisters Hill Trek 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Seven Sisters Hill Trek 6', 5)
) as g(url, caption, sort) where slug='seven-sisters-hill-trek';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Seven Sisters Hill Trek suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='seven-sisters-hill-trek';

-- Silver Falls
update treks set region='India', difficulty='beginner', duration_days=1, altitude='900 - 1600 m', base_camp='Near Nagpur', best_season='October - March', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img6.jpg'), overview='Nature''s hidden cascade nestled in the lush forests near Nagpur - a refreshing monsoon trail.', featured=coalesce(featured,false) where slug='silver-falls';
delete from itinerary_days where trek_id=(select id from treks where slug='silver-falls');
delete from inclusions where trek_id=(select id from treks where slug='silver-falls');
delete from exclusions where trek_id=(select id from treks where slug='silver-falls');
delete from pricing_packages where trek_id=(select id from treks where slug='silver-falls');
delete from trek_gallery where trek_id=(select id from treks where slug='silver-falls');
delete from trek_faqs where trek_id=(select id from treks where slug='silver-falls');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Silver Falls - summit & return', 'Meet the team, safety briefing, then the guided ascent with time at the top before we descend and head back.', '/assets/img/home2/destination-img2.jpg')
) as d(day_no, title, description, image) where slug='silver-falls';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='silver-falls';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='silver-falls';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 79900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 71910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='silver-falls';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Silver Falls 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Silver Falls 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Silver Falls 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Silver Falls 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Silver Falls 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Silver Falls 6', 5)
) as g(url, caption, sort) where slug='silver-falls';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Silver Falls suitable for beginners?', 'It is graded beginner. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='silver-falls';

-- Karwaan Camping
update treks set region='India', difficulty='moderate', duration_days=2, altitude='900 - 1600 m', base_camp='Near Nagpur', best_season='October - March', group_size='15 - 30 trekkers', hero_image=coalesce(hero_image, '/assets/img/home2/destination-img7.jpg'), overview='Riverside camping with bonfire nights and stargazing under clear skies - a relaxed outdoor escape.', featured=coalesce(featured,false) where slug='karwaan-camping';
delete from itinerary_days where trek_id=(select id from treks where slug='karwaan-camping');
delete from inclusions where trek_id=(select id from treks where slug='karwaan-camping');
delete from exclusions where trek_id=(select id from treks where slug='karwaan-camping');
delete from pricing_packages where trek_id=(select id from treks where slug='karwaan-camping');
delete from trek_gallery where trek_id=(select id from treks where slug='karwaan-camping');
delete from trek_faqs where trek_id=(select id from treks where slug='karwaan-camping');
insert into itinerary_days (trek_id, day_no, title, description, image)
select id, d.day_no, d.title, d.description, d.image from treks, (values
  (1, 'Arrival & Near Nagpur base', 'Reach base, settle in, and get briefed for the days ahead.', '/assets/img/home2/destination-img2.jpg'),
  (2, 'Summit push & departure', 'Final ascent for the big views, then descend and wrap up the trip.', '/assets/img/home2/destination-img3.jpg')
) as d(day_no, title, description, image) where slug='karwaan-camping';
insert into inclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Experienced & certified trek leaders', 0),
  ('Forest / entry permits and charges', 1),
  ('First-aid kit and safety equipment', 2),
  ('Return transport from the pick-up point', 3)
) as x(text, sort) where slug='karwaan-camping';
insert into exclusions (trek_id, text, sort)
select id, x.text, x.sort from treks, (values
  ('Meals other than those mentioned', 0),
  ('Personal expenses & tips', 1),
  ('Anything not listed under inclusions', 2),
  ('Cost due to delays beyond our control', 3)
) as x(text, sort) where slug='karwaan-camping';
insert into pricing_packages (trek_id, name, price, inclusions, cta_label, sort)
select id, p.name, p.price, p.inclusions, 'Book Now', p.sort from treks, (values
  ('Standard Batch', 179900, array['Return transport','Trek leaders & permits','First-aid support'], 0),
  ('Private Group (10+)', 161910, array['Everything in Standard','Flexible date of your choice','Dedicated group leader'], 1)
) as p(name, price, inclusions, sort) where slug='karwaan-camping';
insert into trek_gallery (trek_id, image_url, caption, sort_order)
select id, g.url, g.caption, g.sort from treks, (values
  ('/assets/img/home2/gallery-img1-big.jpg', 'Karwaan Camping 1', 0),
  ('/assets/img/home2/gallery-img2-big.jpg', 'Karwaan Camping 2', 1),
  ('/assets/img/home2/gallery-img3-big.jpg', 'Karwaan Camping 3', 2),
  ('/assets/img/home2/gallery-img4-big.jpg', 'Karwaan Camping 4', 3),
  ('/assets/img/home2/gallery-img5-big.jpg', 'Karwaan Camping 5', 4),
  ('/assets/img/home2/gallery-img6-big.jpg', 'Karwaan Camping 6', 5)
) as g(url, caption, sort) where slug='karwaan-camping';
insert into trek_faqs (trek_id, question, answer, sort)
select id, f.q, f.a, f.sort from treks, (values
  ('Is Karwaan Camping suitable for beginners?', 'It is graded moderate. With a basic fitness level and our leaders guiding you, most first-timers manage it well.', 0),
  ('What should I carry?', 'A 20-30L backpack, 2L water, trekking shoes with grip, a headlamp, dry snacks, a light jacket and a valid ID proof.', 1),
  ('How do I confirm my spot?', 'Tap Book Now to reserve online, or message us on WhatsApp. Your spot is confirmed once payment is received.', 2)
) as f(q, a, sort) where slug='karwaan-camping';

