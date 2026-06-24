-- Vietnam expansion — packages: Central Myth, Heritage Trails, Vietnam's Hidden Memories
-- New cities: Nha Trang, Ho Chi Minh City, Dong Hoi, Da Lat
-- New hotels: additional Da Nang, Hoi An, Nha Trang options
-- New tours: 10 unique experiences across all packages

-- ── NEW CITIES ────────────────────────────────────────────────────────────────

insert into cities (id, destination_id, name, vibe_tagline, has_hotels, sort_order) values
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002',
   'Nha Trang',        'Crystal beaches, mud spas & island fun',   true,  5),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002',
   'Ho Chi Minh City', 'Saigon energy — history, street food & motorbike chaos', false, 6),
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002',
   'Dong Hoi',         'Gateway to Phong Nha's epic cave system',  false, 7),
  ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002',
   'Da Lat',           'Cool highland city of waterfalls & pines',  false, 8);

-- ── NEW HOTELS ────────────────────────────────────────────────────────────────

-- DA NANG — additional options from Central Myth package
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values

  ('d0000000-0000-0000-0000-000000000003',
   'Santa Luxury Hotel', 4, null,
   '["Santa Partial Ocean View"]'::jsonb,
   null,
   '09 Do Ba, Bac My An, Ngu Hanh Son. santaluxuryhotel.com',
   4),

  ('d0000000-0000-0000-0000-000000000003',
   'Greenery Hotel', 3, null,
   '["Superior"]'::jsonb,
   null,
   '76 Hà Bổng, Phước Mỹ, Sơn Trà. dananggreeneryhotel.com',
   5);

-- HOI AN — additional options from Central Myth package
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values

  ('d0000000-0000-0000-0000-000000000004',
   'La Siesta Hoi An Resort & Spa', 5, null,
   '["Deluxe"]'::jsonb,
   null,
   '132-134 Hung Vuong, Thanh Ha Ward, Hoi An.',
   4),

  ('d0000000-0000-0000-0000-000000000004',
   'River Suites Hoi An', 4, null,
   '["Superior"]'::jsonb,
   null,
   '04 Nguyen Du, Cam Pho, Hoi An. riversuiteshoian.com',
   5),

  ('d0000000-0000-0000-0000-000000000004',
   'Hoi An Sincerity Hotel & Spa', 3, null,
   '["Superior"]'::jsonb,
   null,
   '01 Lê Đình Thám, Cẩm Sơn, Hội An.',
   6);

-- NHA TRANG
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values

  ('d0000000-0000-0000-0000-000000000005',
   'Marriott Resort & Spa Nha Trang', 5, 'Marriott',
   '["Deluxe"]'::jsonb,
   null,
   'Hon Tre Island, Vinh Nguyen Ward, Nha Trang.',
   1),

  ('d0000000-0000-0000-0000-000000000005',
   'Regalia Hotel Nha Trang', 4, null,
   '["Superior City View"]'::jsonb,
   null,
   '98B Tran Phu, Loc Tho, Nha Trang. regaliahotel.vn',
   2),

  ('d0000000-0000-0000-0000-000000000005',
   'Starlet Hotel', 3, null,
   '["Superior"]'::jsonb,
   null,
   '51 Tue Tinh str, Nha Trang. starlethotel.com.vn',
   3);

-- ── NEW TOURS ─────────────────────────────────────────────────────────────────

insert into explorer_tours
  (id, name, description, category, inclusions, exclusions, sort_order)
values

  -- Hue City Day Tour (from Hoi An) — Central Myth Day 3
  ('f0000000-0000-0000-0000-000000000005',
   'Hue City Day Tour',
   'Day trip from Hoi An to the ancient imperial city of Hue. Visit the iconic Thien Mu Pagoda overlooking the Perfume River, explore the 19th-century Imperial Citadel and Forbidden Purple City built for the Nguyen Emperors, discover conical hat and incense-making workshops, then pay respects at the ornate Tu Duc Royal Tomb set in a lush valley.',
   'Cultural',
   '["Private A/C transfer Hoi An–Hue–Hoi An","Local English-speaking guide","Entrance fees (Imperial Citadel, Tu Duc Tomb, Thien Mu Pagoda)","Lunch at local restaurant","Breakfast"]'::jsonb,
   '["Personal expenses","Tips","Dinner"]'::jsonb,
   105),

  -- Nha Trang City Tour — Central Myth Day 7
  ('f0000000-0000-0000-0000-000000000006',
   'Nha Trang City Tour',
   'A half-day tour of Nha Trang''s best cultural and historic landmarks. Start at the Vietnam Oceanographic Institute at Cau Da to see a vast collection of sea creatures. Then visit Long Son Pagoda with its giant white Buddha, the French-built Stone Cathedral, the dramatic Chong Promontory Rocks, and the ancient Hindu-inspired Po Nagar Cham Towers. End at the lively Dam Market.',
   'Cultural',
   '["Private A/C transfer","Local English-speaking guide","Entrance fees","Lunch"]'::jsonb,
   '["Dinner","Personal expenses","Tips"]'::jsonb,
   106),

  -- Thap Ba Hot Spring & Mud Spa — Central Myth Day 8
  ('f0000000-0000-0000-0000-000000000007',
   'Thap Ba Hot Spring & Mud Spa',
   'An afternoon of pure relaxation at Nha Trang''s famous mineral mud baths. Soak in private egg-shaped tubs or group mud pools, swim in the mineral spring water, and feel completely rejuvenated. Located along a scenic coastal road 4–6 km from the Nha Trang center. Optional visit to the nearby Po Nagar Cham Temples on the return.',
   'Romantic',
   '["Private A/C transfer (bike option on request)","Local guide","Admission fees","Private mud bath tub","Mineral springs swimming"]'::jsonb,
   '["Lunch & dinner","Personal expenses","Tips"]'::jsonb,
   107),

  -- Ho Chi Minh City Motorbike Highlights Tour — Heritage Trails Day 2 / Hidden Memories Day 2
  ('f0000000-0000-0000-0000-000000000008',
   'Saigon Motorbike City Highlights Tour',
   'See Ho Chi Minh City like a local on a 3-hour scooter tour through the heart of Saigon. Zip through French colonial landmarks, hidden local alleyways, and lively street scenes. Stops include Notre Dame Cathedral, the Opera House, the Central Post Office, City Hall, Chinatown, Medicine Street, and Thien Hau Temple — ending with sugarcane juice at a local market.',
   'Adventure',
   '["Licensed local guide driver","Licensed motorbike & fuel","High-quality helmet","Rain poncho if needed","Sugarcane juice & market snack"]'::jsonb,
   '["Lunch & dinner","Personal expenses","Tips"]'::jsonb,
   108),

  -- Cu Chi Tunnels Tour — Hidden Memories Day 1
  ('f0000000-0000-0000-0000-000000000009',
   'Cu Chi Tunnels Half-Day Tour',
   'An unforgettable journey into Vietnam''s wartime history. Explore the legendary Cu Chi Tunnels — a vast underground network used by Viet Cong fighters during the war, complete with kitchens, field hospitals, weapon factories, and hidden trap doors. Watch an introductory film, crawl through the tunnels, and enjoy traditional tea and cassava. Optional: real shooting range (extra cost).',
   'Cultural',
   '["Shuttle bus transfer","Local English-speaking guide","Entrance fees","Introductory film","Tea & cassava tasting"]'::jsonb,
   '["Lunch & dinner","Shooting range (optional, extra)","Personal expenses","Tips"]'::jsonb,
   109),

  -- Phong Nha Cave & Dark Cave — Heritage Trails Day 5
  ('f0000000-0000-0000-0000-000000000010',
   'Phong Nha Cave & Dark Cave Adventure',
   'The ultimate cave adventure in the UNESCO-listed Phong Nha-Ke Bang National Park. Morning at Dark Cave: long zipline over the river, kayaking, adventure course, and cave mud bathing in the pitch dark. Afternoon: take a 30-minute traditional dragon boat up the river to the stunning Phong Nha Cave, with 300m of on-foot exploration inside. Swimwear required.',
   'Adventure',
   '["Shuttle bus transfer","Local English-speaking guide","Entrance tickets","Zipline harness, helmet, kayak equipment","Boat trip to Phong Nha Cave","Lunch","First aid kit"]'::jsonb,
   '["Personal expenses","Tips","Swimwear & towel (bring your own)"]'::jsonb,
   110),

  -- Halong Bay Day Cruise (6 hours) — Heritage Trails Day 7
  ('f0000000-0000-0000-0000-000000000011',
   'Halong Bay Day Cruise (6 Hours)',
   'A 6-hour group cruise through the UNESCO-listed Halong Bay, departing from Tuan Chau Harbor. Sail among the famous limestone karsts — named for their imaginative shapes — and stop to explore Surprising Cave''s stalactites and stalagmites, kayak through the tranquil Luon Cave lagoon, and climb Titov Island for a sweeping panoramic view of the bay. Includes Vietnamese seafood lunch on board.',
   'Nature',
   '["Shuttle bus Hanoi–Halong–Hanoi","Local English-speaking guide","Sharing cruise","Entrance fees","Kayaking","Seafood lunch on board"]'::jsonb,
   '["Personal expenses","Tips","Beverages (own account)"]'::jsonb,
   111),

  -- Da Lat Highlands Day Tour — Hidden Memories Day 3
  ('f0000000-0000-0000-0000-000000000012',
   'Da Lat Highlands Day Tour',
   'A full day in Vietnam''s charming highland city of Da Lat. Ride an Alpine Coaster down Datanla Waterfall, explore the surreal Crazy House (a Gaudi-inspired architectural wonder), and visit the serene Truc Lam Zen Monastery via cable car (optional). In the afternoon, take a Jeep through pine forests up to Langbiang Mountain for panoramic views and the vibrant Gong Show at the peak.',
   'Adventure',
   '["Shuttle bus transfer","Local English-speaking guide","Entrance fees (Datanla Falls, Crazy House, Langbiang)"]'::jsonb,
   '["Lunch (own expense)","Alpine Coaster ticket (optional)","Cable car (optional)","Jeep car (optional)","Gong Show (optional)","Personal expenses","Tips"]'::jsonb,
   112),

  -- Conical Hat Village & Incense Village — Hidden Memories Day 6
  ('f0000000-0000-0000-0000-000000000013',
   'Conical Hat Village & Incense Village Tour',
   'An afternoon of authentic Vietnamese craftsmanship in Hanoi''s countryside. Visit Chuong Village, where artisans have handcrafted the iconic Vietnamese non la (conical hat) for over 300 years. Then head to Quang Phu Cau Incense Village — a photographer''s dream — where thousands of red incense sticks dry in dramatic formations and workers demonstrate the full incense-making process from bamboo to finished stick.',
   'Cultural',
   '["Shuttle bus transfer","Local English-speaking guide","Entrance fees"]'::jsonb,
   '["Lunch & dinner","Personal expenses","Tips"]'::jsonb,
   113),

  -- Lan Ha Bay Day Trip — Hidden Memories Day 7
  ('f0000000-0000-0000-0000-000000000014',
   'Lan Ha Bay Day Trip',
   'A full-day cruise through the pristine Lan Ha Bay — Halong Bay''s quieter, equally stunning neighbor near Cat Ba Island. Sail past ancient floating fishing villages, kayak through hidden lagoons, swim in crystal-clear water, visit the 7,000-year-old Cai Beo floating village, explore Viet Hai Village by electric car, and enjoy a fresh seafood lunch on board. Ends with a sunset party on deck.',
   'Water',
   '["Shuttle bus Hanoi–Cat Ba–Hanoi","Local English-speaking guide","Sharing cruise","Entrance fees","Kayaking","Electric car to Viet Hai Village","Seafood lunch on board","Sunset snacks & tea"]'::jsonb,
   '["Personal expenses","Tips","Beverages"]'::jsonb,
   114);

-- ── TOUR–CITY MAPPINGS ────────────────────────────────────────────────────────

insert into tour_cities (tour_id, city_id) values
  -- Hue Day Tour → departs from Hoi An
  ('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004'),
  -- Nha Trang City Tour → Nha Trang
  ('f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000005'),
  -- Thap Ba Mud Spa → Nha Trang
  ('f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000005'),
  -- Saigon Motorbike Tour → Ho Chi Minh City
  ('f0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000006'),
  -- Cu Chi Tunnels → Ho Chi Minh City
  ('f0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000006'),
  -- Phong Nha & Dark Cave → Dong Hoi
  ('f0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000007'),
  -- Halong Bay Day Cruise → Hanoi (day trip from Hanoi)
  ('f0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000001'),
  -- Da Lat Highlands → Da Lat
  ('f0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000008'),
  -- Conical Hat & Incense Village → Hanoi
  ('f0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000001'),
  -- Lan Ha Bay Day Trip → Hanoi (day trip from Hanoi)
  ('f0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000001');
