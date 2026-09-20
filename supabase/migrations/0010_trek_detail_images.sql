-- Point the seeded trek's images at files that actually exist under
-- public/assets/img/home2 (the trek-*.jpg names never shipped).
update treks set hero_image = '/assets/img/home2/destination-img1.jpg'
  where slug = 'harishchandragad-trek';

update itinerary_days set image = '/assets/img/home2/destination-img2.jpg'
  where day_no = 1 and trek_id = (select id from treks where slug='harishchandragad-trek');
update itinerary_days set image = '/assets/img/home2/destination-img3.jpg'
  where day_no = 2 and trek_id = (select id from treks where slug='harishchandragad-trek');

update trek_gallery g set image_url = m.url
from (values
  (0, '/assets/img/home2/gallery-img1-big.jpg'),
  (1, '/assets/img/home2/gallery-img2-big.jpg'),
  (2, '/assets/img/home2/gallery-img3-big.jpg'),
  (3, '/assets/img/home2/gallery-img4-big.jpg'),
  (4, '/assets/img/home2/gallery-img5-big.jpg'),
  (5, '/assets/img/home2/gallery-img6-big.jpg')
) as m(sort_order, url)
where g.sort_order = m.sort_order
  and g.trek_id = (select id from treks where slug='harishchandragad-trek');
