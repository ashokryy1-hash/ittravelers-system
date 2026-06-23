-- Vietnam — Charming Vietnam Tour package
-- Cities: Hanoi, Halong Bay, Da Nang, Hoi An
-- Hotels: 3/4/5-star per city + 4 day-tour experiences

-- ── DESTINATION ──────────────────────────────────────────────────────────────

insert into destinations (id, name, country, cover_image_url, vibe_description, mood_tags) values (
  'a0000000-0000-0000-0000-000000000002',
  'Vietnam',
  'Vietnam',
  'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200',
  'Vietnam is a country of breathtaking contrasts — from the misty limestone karsts of Halong Bay to the lantern-lit alleyways of Hoi An Ancient Town. Every city has its own soul: Hanoi''s French colonial streets, Da Nang''s golden beaches, and the timeless charm of Hoi An. Perfect for couples who want culture, scenery, and unforgettable experiences all in one journey.',
  '["Cultural","Nature","Romantic","Adventure","UNESCO","Historic","Beach","Cruise"]'::jsonb
);

-- ── CITIES ───────────────────────────────────────────────────────────────────

insert into cities (id, destination_id, name, vibe_tagline, has_hotels, sort_order) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Hanoi',      'Ancient streets, lakes & French charm',    true, 1),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Halong Bay', 'UNESCO cruise through limestone paradise',  true, 2),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Da Nang',    'Golden Bridge, beaches & Ba Na Hills',      true, 3),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Hoi An',     'Lantern town, basket boats & silk streets', true, 4);

-- ── HOTELS ───────────────────────────────────────────────────────────────────

-- HANOI
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values

  ('d0000000-0000-0000-0000-000000000001',
   'Hotel Du Parc Hanoi', 5, null,
   '["Deluxe"]'::jsonb,
   null,
   '84 Tran Nhan Tong Str, Hanoi. hotelduparchanoi.com',
   1),

  ('d0000000-0000-0000-0000-000000000001',
   'Champton Hanoi Hotel', 4, null,
   '["Deluxe Internal Window"]'::jsonb,
   null,
   '130 P. Hàng Bông, Hoàn Kiếm, Hà Nội. champtonhotel.com',
   2),

  ('d0000000-0000-0000-0000-000000000001',
   'Chalcedony Grand Hotel', 3, null,
   '["Deluxe"]'::jsonb,
   null,
   '4 Nguyen Truong To, Ba Dinh, Hanoi.',
   3);

-- HALONG BAY (cruises)
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values

  ('d0000000-0000-0000-0000-000000000002',
   'Ambassador Cruise', 5, null,
   '["Deluxe Balcony 1st Floor"]'::jsonb,
   null,
   'Halong International Cruise Port, Bai Chay Ward. ambassadorcruise.com. All-inclusive cruise.',
   1),

  ('d0000000-0000-0000-0000-000000000002',
   'Verdure Lotus Classic Cruise', 4, null,
   '["Deluxe Balcony 1st Floor"]'::jsonb,
   null,
   'No 28a, Tuan Chau, Ha Long. verdurelotuscruises.com. All-inclusive cruise.',
   2),

  ('d0000000-0000-0000-0000-000000000002',
   'Le Journey Premium Cruise', 3, null,
   '["Deluxe Cabin 1st Floor"]'::jsonb,
   null,
   'Block No 12, Tuan Chau International Port. lejourneyhalongcruise.com. Budget cruise option.',
   3);

-- DA NANG
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values

  ('d0000000-0000-0000-0000-000000000003',
   'DLG Hotel Da Nang', 5, null,
   '["Deluxe Double Ocean View"]'::jsonb,
   null,
   '258 Võ Nguyên Giáp, Phước Mỹ, Sơn Trà. dlghoteldanang.com',
   1),

  ('d0000000-0000-0000-0000-000000000003',
   'Mandila Beach Hotel', 4, null,
   '["Deluxe Partial Sea View"]'::jsonb,
   null,
   '218 Vo Nguyen Giap, Phuoc My, Son Tra. mandilabeachhotel.com',
   2),

  ('d0000000-0000-0000-0000-000000000003',
   'Cosmos Hotel Danang', 3, null,
   '["Deluxe City View"]'::jsonb,
   null,
   '117-119 Ngo Thi Si, Ngu Hanh Son District. cosmoshoteldanang.com',
   3);

-- HOI AN
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values

  ('d0000000-0000-0000-0000-000000000004',
   'Little Riverside Hoi An – Little Luxury Hotel & Spa', 5, null,
   '["Superior"]'::jsonb,
   null,
   '09 Đường Phan Bội Châu, Cẩm Châu, Hội An.',
   1),

  ('d0000000-0000-0000-0000-000000000004',
   'Hadana Boutique Resort Hoi An', 4, null,
   '["Superior"]'::jsonb,
   null,
   '538 Cua Dai, Cam Chau, Hoi An. hadanahoianresort.com',
   2),

  ('d0000000-0000-0000-0000-000000000004',
   'Kim An Hotel', 3, null,
   '["Superior"]'::jsonb,
   null,
   '463 Tan An, Hoi An. kimanhotel.com',
   3);

-- ── TOURS ────────────────────────────────────────────────────────────────────

insert into explorer_tours
  (id, name, description, category, inclusions, exclusions, sort_order)
values

  ('f0000000-0000-0000-0000-000000000001',
   'Ninh Binh Day Tour – Hoa Lu & Trang An',
   'Full-day trip from Hanoi to Ninh Binh. Visit Hoa Lu ancient capital with 10th-century temples of King Dinh and King Le, then take a scenic boat excursion through Trang An''s stunning grottos and stalactite caves — a UNESCO World Heritage site.',
   'Cultural',
   '["Private A/C transfer","Local English-speaking guide","Entrance fees","Scenic boat trip through Trang An grottos","Breakfast"]'::jsonb,
   '["Lunch & dinner","Personal expenses","Tips for guide & driver"]'::jsonb,
   101),

  ('f0000000-0000-0000-0000-000000000002',
   'Halong Bay Overnight Cruise',
   'Sail through the UNESCO World Heritage site of Halong Bay on an overnight cruise. Explore limestone caves, swim in emerald waters, watch the sunset from the deck, and enjoy a Tai Chi session on the sun deck at sunrise.',
   'Nature',
   '["Private transfer to/from port","Overnight cabin on cruise","All meals on board (Breakfast, Lunch, Dinner, Brunch)","Cave exploration","Swimming stop","Sunset viewing","Morning Tai Chi class","Complimentary tea, coffee & 2 water bottles per room"]'::jsonb,
   '["Drinks during meals & minibar","Personal expenses","Tips","Wi-Fi (limited connectivity)"]'::jsonb,
   102),

  ('f0000000-0000-0000-0000-000000000003',
   'Ba Na Hills & Golden Bridge Tour',
   'A full-day adventure to Ba Na Hills in the misty mountains above Da Nang. Ride the record-breaking cable car, walk the iconic Golden Bridge held by giant stone hands, stroll through the French village, visit Le Jardin D''Amour flower garden, and explore Fantasy Park.',
   'Adventure',
   '["Private A/C transfer","Local English-speaking guide","Cable car round trip (Ba Na Hills)","Breakfast"]'::jsonb,
   '["Lunch (own expense)","Wax Museum entrance","Wine Cellar entrance & wine","Roller Coaster & games","10D movie","Personal expenses","Tips"]'::jsonb,
   103),

  ('f0000000-0000-0000-0000-000000000004',
   'Basket Boat & Hoi An Ancient Town',
   'Afternoon departure for Cam Thanh coconut forest where you ride a traditional round basket boat through the waterways — catch crabs, make coconut leaf toys, and watch the boat spin dance. Then explore Hoi An Ancient Town: Japanese Covered Bridge, Sa Huynh Museum, lantern-lit streets. End with a magical lantern boat ride on the Hoai River.',
   'Cultural',
   '["Private A/C transfer","Local English-speaking guide","Entrance fees (Hoi An Ancient Town)","Basket boat experience (~30 min)","Lantern boat ride on Hoai River","Breakfast"]'::jsonb,
   '["Shopping & personal expenses","Lunch & dinner","Tips"]'::jsonb,
   104);

-- ── TOUR–CITY MAPPINGS ────────────────────────────────────────────────────────

insert into tour_cities (tour_id, city_id) values
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'), -- Ninh Binh → Hanoi
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002'), -- Halong Cruise → Halong Bay
  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003'), -- Ba Na Hills → Da Nang
  ('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004'); -- Basket Boat & Hoi An → Hoi An
