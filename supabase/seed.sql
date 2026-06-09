-- ITTravelers Trip Explorer — Seed Data
-- Run this AFTER the migration SQL (001_initial_schema.sql)
-- Run in Supabase SQL Editor: Database → SQL Editor → New query

-- ─── Destination ──────────────────────────────────────────────────────────────

insert into destinations (id, name, country, cover_image_url, vibe_description, mood_tags) values (
  'd1000000-0000-0000-0000-000000000001',
  'Bali',
  'Indonesia',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
  'The world''s most romantic island — where jungle meets ocean, ancient temples glow at sunset, and every resort feels like it was built for two. Bali is the perfect honeymoon destination for couples who want to feel something — whether that''s the calm of Ubud''s rice terraces, the energy of Seminyak''s beach clubs, or the dramatic cliffs of Uluwatu.',
  '["Romantic","Cultural","Spiritual","Beach","Jungle","Adventurous","Luxury"]'::jsonb
);

-- ─── Cities ───────────────────────────────────────────────────────────────────

insert into cities (id, destination_id, name, vibe_tagline, has_hotels, sort_order) values
  ('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Ubud',               'Cultural heart of Bali',         true,  1),
  ('c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Seminyak',           'Bali''s most vibrant beach scene', true,  2),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'Canggu',             'Surf, rice fields, hip vibes',   true,  3),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'Uluwatu & Jimbaran', 'Clifftops, fire dance, ocean views', true, 4),
  ('c1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000001', 'Nusa Penida',        'Wild island day trips',          false, 5),
  ('c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000001', 'Sanur',              'Calm, quiet beach town',         true,  6),
  ('c1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000001', 'East Bali',          'Remote and unique hideaways',    true,  7),
  ('c1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', 'Gili Trawangan',     'Island escape',                  true,  8),
  ('c1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000001', 'North Bali',         'Dolphins and highland charm',    false, 9);

-- ─── Hotels ───────────────────────────────────────────────────────────────────

-- UBUD
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values
  ('c1000000-0000-0000-0000-000000000001', 'Kaamala Luxury Resort & Spa', 5, 'Ini Vie',
   '["Suite Forest View","Grand Suite Valley View","Grand Suite Ricefield View","Grand Suite Valley View Lagoon Access","One BR Villa PP","Grand 1BR PP Villa Ricefield View","One BR Villa PP Ricefield View","Grand 2BR PP Villa Ricefield View"]'::jsonb,
   'https://bit.ly/KaamalaResortUbud', null, 1),
  ('c1000000-0000-0000-0000-000000000001', 'Aksari Luxury Resort & Spa', 5, 'Ini Vie',
   '["Suite Forest View","Grand 1BR Villa PP","Grand 1BR River View Villa PP","Grand 2BR River View Villa PP"]'::jsonb,
   'https://bit.ly/Aksari_Resort_Ubud', null, 2),
  ('c1000000-0000-0000-0000-000000000001', 'Equipoise Resort', 5, 'Ini Vie',
   '["One BR Villa PP","One BR Villa PP Ricefield View","Presidential Suite"]'::jsonb,
   'https://bit.ly/EquipoiseResortUbud', null, 3),
  ('c1000000-0000-0000-0000-000000000001', 'Asvara Villa', 5, 'Ini Vie',
   '["Royal 1BR PP+Jacuzzi","Grand 1BR Ricefield PP+Jacuzzi","Royal 2BR PP+Jacuzzi"]'::jsonb,
   'https://bit.ly/AsvaraVillaUbud', null, 4),
  ('c1000000-0000-0000-0000-000000000001', 'Asvara Luxury Resort & Spa', 5, 'Ini Vie',
   '["1BR Villa PP+Jacuzzi","2BR Villa PP+Jacuzzi"]'::jsonb,
   'https://bit.ly/AsvaraResortUbud', null, 5),
  ('c1000000-0000-0000-0000-000000000001', 'Amarea Resort & Spa', 5, 'Ini Vie',
   '["Ubud Room","Ubud Suite","Ubud Cottage","Cottage Room Pool","Smart 1BR Villa PP","Grand 1BR Villa PP","Grand 2BR Loft Villa PP","Grand 2BR Villa PP"]'::jsonb,
   'https://bit.ly/AmareaUbud', null, 6),
  ('c1000000-0000-0000-0000-000000000001', 'Maar Resort', 5, 'Ini Vie',
   '["1BR Villa Jacuzzi (no pool)","Grand 1BR PP","Ubud Suite","2BR PP"]'::jsonb,
   'https://bit.ly/MaarResortUbud_', null, 7),
  ('c1000000-0000-0000-0000-000000000001', 'Dedary Resort & Spa', 4, 'Ini Vie',
   '["1BR Villa PP+Bathtub","Grand 1BR Garden Villa PP+Jacuzzi","1BR Forest Villa PP","Grand 1BR Garden Villa PP","2BR Villa PP","Grand 2BR Forest Villa PP"]'::jsonb,
   'https://bit.ly/DedaryResortUbud', null, 8),
  ('c1000000-0000-0000-0000-000000000001', 'Suara Alam', 5, 'Ini Vie',
   '["Paddies Room","Grand Suite Room","Jungle Room","Jungle Room Plunge Pool"]'::jsonb,
   'https://bit.ly/SuaraAlamUbud', 'Adults only', 9);

-- SEMINYAK
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values
  ('c1000000-0000-0000-0000-000000000002', 'Sini Vie Luxury Resort & Spa', 5, 'Ini Vie',
   '["Smart Suite Room","Grand Smart Suite Room","Smart 1BR Villa PP+Jacuzzi","Grand Smart 1BR Villa PP+Jacuzzi","Grand Smart 1BR Villa PP+Jacuzzi Lagoon Access","Grand Royal Smart 1BR Villa PP+Jacuzzi"]'::jsonb,
   'https://bit.ly/SiniVieResortt', null, 1),
  ('c1000000-0000-0000-0000-000000000002', 'Monolocale Luxury Resort & Spa', 5, 'Ini Vie',
   '["Seminyak Suite","1BR Villa PP","Royal 1BR Villa PP"]'::jsonb,
   'https://bit.ly/MonolocaleResort', null, 2),
  ('c1000000-0000-0000-0000-000000000002', 'Aksari Seminyak', 5, 'Ini Vie',
   '["Royal Smart 1BR Villa PP+Jacuzzi"]'::jsonb,
   'https://bit.ly/AksariSeminyakVilla', null, 3),
  ('c1000000-0000-0000-0000-000000000002', 'Astera Seminyak', 5, 'Ini Vie',
   '["1BR Villa PP+Bathtub","Royal 1BR Villa PP"]'::jsonb,
   'https://bit.ly/AsteraSeminyakVilla', null, 4),
  ('c1000000-0000-0000-0000-000000000002', 'Sana Vie Villa', 5, 'Ini Vie',
   '["Grand Smart 1BR Villa PP","2BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/SanaVieVilla', null, 5),
  ('c1000000-0000-0000-0000-000000000002', 'Aleva Villa', 5, 'Ini Vie',
   '["Royal 1BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/AlevaVilla', null, 6),
  ('c1000000-0000-0000-0000-000000000002', 'Ayona Villa', 5, 'Ini Vie',
   '["1BR Villa PP+Bathtub","Grand 1BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/AyonaVilla', null, 7),
  ('c1000000-0000-0000-0000-000000000002', 'Cyrus Villa', 5, 'Ini Vie',
   '["1BR Villa PP+Bathtub","Grand 1BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/CyrusVilla', 'Adults only, max 2 pax', 8),
  ('c1000000-0000-0000-0000-000000000002', 'Eight Palms', 5, 'Ini Vie',
   '["2BR Villa PP","3BR Villa PP","Royal 3BR Villa PP+Jacuzzi","Royal 3BR Waterslide PP+Jacuzzi"]'::jsonb,
   'https://bit.ly/EightPalmsVilla', null, 9),
  ('c1000000-0000-0000-0000-000000000002', 'La Vie Villa', 4, 'Ini Vie',
   '["Royal 1BR Villa PP+Bathtub","Grand 1BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/LaVieVilla_', null, 10),
  ('c1000000-0000-0000-0000-000000000002', 'Seminyak Sanctuary', 4, 'Ini Vie',
   '["Grand 1BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/SeminyakSanctuary', null, 11),
  ('c1000000-0000-0000-0000-000000000002', 'Ini Vie Villa', 4, 'Ini Vie',
   '["Royal 1BR Villa PP+Jacuzzi","Royal 2BR Villa PP+Jacuzzi"]'::jsonb,
   'https://bit.ly/IniVieVilla', null, 12),
  ('c1000000-0000-0000-0000-000000000002', 'Palmea Villa', 4, 'Ini Vie',
   '["1BR Villa PP"]'::jsonb,
   'https://bit.ly/PalmeaVilla', null, 13),
  ('c1000000-0000-0000-0000-000000000002', 'La Mira Villa', 4, 'Ini Vie',
   '["Royal 1BR Villa PP+Waterslide","Royal 2BR Waterslide PP","Royal 3BR Waterslide PP+Bathtub"]'::jsonb,
   'https://bit.ly/LaMiraVilla', null, 14),
  ('c1000000-0000-0000-0000-000000000002', 'Kolila Villa', 4, 'Ini Vie',
   '["2BR Villa PP+Bathtub","3BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/KolilaVilla', null, 15);

-- CANGGU
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values
  ('c1000000-0000-0000-0000-000000000003', 'Astera Luxury Resort & Spa Canggu', 5, 'Ini Vie',
   '["Loft Suite Room","Smart 1BR Villa PP","Smart Loft 1BR Villa PP+Jacuzzi","Smart Royal 1BR Villa PP+Jacuzzi"]'::jsonb,
   'https://bit.ly/AsteraCanggu', null, 1),
  ('c1000000-0000-0000-0000-000000000003', 'Teratai Villa Canggu', 5, 'Ini Vie',
   '["1BR Villa PP+Bathtub","Grand 1BR Villa PP+Bathtub","2BR Villa PP+Bathtub","Grand 2BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/TerataiCangguVilla', null, 2),
  ('c1000000-0000-0000-0000-000000000003', 'Ayona Canggu', 5, 'Ini Vie',
   '["Deluxe 1BR Villa PP","1BR Villa PP+Bathtub","Grand 1BR PP Forest View","Sky 1BR PP Forest View"]'::jsonb,
   'https://bit.ly/AyonaCanggu', null, 3),
  ('c1000000-0000-0000-0000-000000000003', 'Atap Resort Canggu', 5, 'Ini Vie',
   '["Suite Room","1BR Villa PP","Grand 1BR Villa PP+Jacuzzi"]'::jsonb,
   'https://bit.ly/AtapResortCanggu', null, 4),
  ('c1000000-0000-0000-0000-000000000003', 'Canggu Cabana Resort & Spa', 5, 'Ini Vie',
   '["Suite Garden View","Suite Double","Suite Plunge Pool","Cabana Rooftop Seaview","Grand Cabana Rooftop Seaview","2BR Loft"]'::jsonb,
   'https://bit.ly/CangguCabana', 'No children under 15, no pets, no drones', 5),
  ('c1000000-0000-0000-0000-000000000003', 'Manca Villa', 4, 'Ini Vie',
   '["Royal 1BR Villa PP+Bathtub","Grand 1BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/MancaVIlla', null, 6),
  ('c1000000-0000-0000-0000-000000000003', 'Aeera Villa', 4, 'Ini Vie',
   '["Suite Room","Royal Smart 1BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/AeeraVilla', null, 7),
  ('c1000000-0000-0000-0000-000000000003', 'Nara Villa Canggu', 5, 'Ini Vie',
   '["3BR PP Villa","4BR PP Villa","5BR PP Villa"]'::jsonb,
   'https://bit.ly/NaraVillaCanggu', null, 8),
  ('c1000000-0000-0000-0000-000000000003', 'Kanadea Villa', 4, 'Ini Vie',
   '["2BR Villa PP","3BR Villa PP"]'::jsonb,
   'https://bit.ly/KanadeaVilla', null, 9),
  ('c1000000-0000-0000-0000-000000000003', 'Earth Villa', 4, 'Ini Vie',
   '["1BR Villa PP+Bathtub","2BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/EarthVilla', null, 10),
  ('c1000000-0000-0000-0000-000000000003', 'Canggu Circle', 4, 'Ini Vie',
   '["1BR Villa PP+Bathtub","2BR Villa PP+Bathtub","Royal 2BR Villa PP","3BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/CangguCircle', null, 11),
  ('c1000000-0000-0000-0000-000000000003', 'The Vinava Villa', 4, 'Ini Vie',
   '["2BR Villa PP","3BR Villa PP"]'::jsonb,
   'https://bit.ly/TheVinavaVilla', null, 12),
  ('c1000000-0000-0000-0000-000000000003', 'Cabana Kedungu', 4, 'Ini Vie',
   '["4BR PP Villa","5BR PP Villa"]'::jsonb,
   'https://bit.ly/CabanaKedungu', 'Room only, free entrance to TT Beach Club and Jungle Club', 13);

-- SANUR
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values
  ('c1000000-0000-0000-0000-000000000006', 'Sanora Villa', 5, 'Ini Vie',
   '["2BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/SanoraVillaSanur', null, 1),
  ('c1000000-0000-0000-0000-000000000006', 'Seascape Luxury Resort & Spa Sanur', 5, 'Ini Vie',
   '["Suite Room","Grand Suite Room","1BR Villa PP","Grand 1BR Villa PP"]'::jsonb,
   'https://bit.ly/SeaescapeSanur', 'No children under 15', 2);

-- ULUWATU & JIMBARAN
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values
  ('c1000000-0000-0000-0000-000000000004', 'The Arden Villa Uluwatu', 5, 'Ini Vie',
   '["Suite Room","1BR Villa PP"]'::jsonb,
   'https://bit.ly/TheArdenVilla', null, 1),
  ('c1000000-0000-0000-0000-000000000004', 'Seascape Luxury Resort & Spa Uluwatu', 5, 'Ini Vie',
   '["Suite Room","Grand Suite Room","Deluxe Suite Room","Cabana Room Infinity Pool","Grand Cabana Infinity Pool","2BR Ocean View PP"]'::jsonb,
   'https://bit.ly/SeascapeResortUluwatu', 'Adults only for Cabana rooms, no children under 15', 2),
  ('c1000000-0000-0000-0000-000000000004', 'The Jimbaran Villa', 4, 'Ini Vie',
   '["1BR Villa PP+Bathtub"]'::jsonb,
   'https://bit.ly/TheJimbaranVilla', null, 3);

-- EAST BALI
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values
  ('c1000000-0000-0000-0000-000000000007', 'Hideout Bali', 5, 'Ini Vie',
   '["Hay House","Lightroom","Zen","Bamboo Home","Hideout Bali","Falcon","Beehive","Horizon","Cocoon","Tantra","Reflection","Element","Flow","Leaf"]'::jsonb,
   'https://bit.ly/Hideoutbali', null, 1);

-- GILI TRAWANGAN
insert into explorer_hotels (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order) values
  ('c1000000-0000-0000-0000-000000000008', 'Kardia Resort', 5, null,
   '["Deluxe Room","Superior Room","Garden Villa","Pool Villa"]'::jsonb,
   null, null, 1);

-- ─── Tours ────────────────────────────────────────────────────────────────────

insert into explorer_tours (id, name, description, category, tour_link_url, sort_order) values
  -- ROMANTIC
  ('t0000000-0000-0000-0000-000000000001', 'Sea Sky & Spa',
   'The ultimate blend of ocean breezes, clifftop views, and traditional Balinese healing',
   'Romantic', 'https://beyondbalitours.my.canva.site/cute-together-couple-tour', 1),
  ('t0000000-0000-0000-0000-000000000002', 'Sweet Moments',
   'Curated for slow mornings and golden hour magic in Bali''s most scenic corners',
   'Romantic', 'https://beyondbalitours.my.canva.site/sweet-moments-tour', 2),
  ('t0000000-0000-0000-0000-000000000003', 'Only Me & You',
   'A private, intimate journey designed for deep connection and quiet luxury',
   'Romantic', 'https://beyondbalitours.my.canva.site/only-me-you-tour', 3),
  ('t0000000-0000-0000-0000-000000000004', 'Cute Together',
   'Fun, photogenic, and lighthearted stops for the couple that loves to explore',
   'Romantic', 'https://beyondbalitours.my.canva.site/cute-together-couple-tour', 4),
  ('t0000000-0000-0000-0000-000000000005', 'Jungle Paradise',
   'Get lost in the lush greenery and hidden waterfalls of the island''s heart',
   'Romantic', 'https://beyondbalitours.my.canva.site/jungle-paradise-tour', 5),
  ('t0000000-0000-0000-0000-000000000006', 'Tanah Lot Tour',
   'Sunset views and sea temples for the ultimate coastal aesthetic',
   'Romantic', 'https://beyondbalitours.my.canva.site/tanah-lot-tour', 6),
  ('t0000000-0000-0000-0000-000000000007', 'Uluwatu Tour',
   'Dramatic clifftops, fire dances, and the wild southern coast',
   'Romantic', 'https://beyondbalitours.my.canva.site/uluwatu-tour', 7),
  -- ADVENTURE
  ('t0000000-0000-0000-0000-000000000008', 'Mt. Batur Sunrise Jeep Tour',
   'Skip the hike and catch the golden hour from a 4x4',
   'Adventure', 'https://beyondbalitours.my.canva.site/sunrise-jeep-tour', 8),
  ('t0000000-0000-0000-0000-000000000009', 'Mt. Batur Sunset Jeep Tour',
   'The volcano''s beauty without the early wakeup call',
   'Adventure', 'https://beyondbalitours.my.canva.site/sunset-jeep-tour', 9),
  ('t0000000-0000-0000-0000-000000000010', 'Mt. Batur ATV & Jeep Tour',
   'The ultimate off-road combo across black lava fields',
   'Adventure', 'https://beyondbalitours.my.canva.site/jeep-atv', 10),
  ('t0000000-0000-0000-0000-000000000011', 'Ubud ATV Tour',
   'Mud, rice fields, and tunnels — Ubud''s best adrenaline rush',
   'Adventure', 'https://beyondbalitours.my.canva.site/ubud-atv-tour', 11),
  ('t0000000-0000-0000-0000-000000000012', 'Ubud Rafting Tour',
   'Navigate the Ayung River''s rapids through lush tropical gorges',
   'Adventure', 'https://beyondbalitours.my.canva.site/ubud-rafting-tour', 12),
  ('t0000000-0000-0000-0000-000000000013', 'Nusa Penida Jumping Tour',
   'For the thrill-seekers — cliff jumping and hidden lagoons',
   'Adventure', 'https://beyondbalitours.my.canva.site/nusa-penida-jumping-tour', 13),
  -- CULTURAL
  ('t0000000-0000-0000-0000-000000000014', 'Instagram Tour',
   'Hit Bali''s most iconic photo spots in one day',
   'Cultural', 'https://beyondbalitours.my.canva.site/instagram-tour', 14),
  ('t0000000-0000-0000-0000-000000000015', 'Lempuyang Tour',
   'Experience the Gateway to Heaven and East Bali''s royal water palaces',
   'Cultural', 'https://beyondbalitours.my.canva.site/lempuyang-tour', 15),
  ('t0000000-0000-0000-0000-000000000016', 'Gianyar Tour',
   'A deep dive into Bali''s cultural soul and traditional night markets',
   'Cultural', 'https://beyondbalitours.my.canva.site/gianyar-tour', 16),
  ('t0000000-0000-0000-0000-000000000017', 'Ubud Elephant Tour',
   'Get up close with gentle giants in the heart of the jungle',
   'Cultural', 'https://beyondbalitours.my.canva.site/ubud-elephant-tour', 17),
  -- NATURE
  ('t0000000-0000-0000-0000-000000000018', 'Nusa Penida West Tour',
   'Home to the famous Kelingking T-Rex Beach',
   'Nature', 'https://beyondbalitours.my.canva.site/nusa-penida-west-tour', 18),
  ('t0000000-0000-0000-0000-000000000019', 'Nusa Penida East Tour',
   'Discover the rugged cliffs of Diamond Beach and Tree House',
   'Nature', 'https://beyondbalitours.my.canva.site/nusa-penida-east-tour', 19),
  ('t0000000-0000-0000-0000-000000000020', 'Nusa Penida Mix Tour',
   'The Best of Both Worlds covering East and West highlights',
   'Nature', 'https://beyondbalitours.my.canva.site/nusa-penida-mix-tour', 20),
  ('t0000000-0000-0000-0000-000000000021', 'Nusa Lembongan Tour',
   'A chilled-out escape to Bali''s quieter, turquoise neighbor',
   'Nature', 'https://beyondbalitours.my.canva.site/nusa-lembongan-tour', 21),
  ('t0000000-0000-0000-0000-000000000022', 'Lovina Dolphin Tour',
   'A sunrise boat trip to see dolphins in their natural habitat',
   'Nature', 'https://beyondbalitours.my.canva.site/lovina-dolphin-tour', 22),
  ('t0000000-0000-0000-0000-000000000023', 'Lovina Dolphin & Farm Tour',
   'Dolphins at dawn followed by a visit to local highlands',
   'Nature', 'https://beyondbalitours.my.canva.site/dolphin-farm-tour', 23),
  ('t0000000-0000-0000-0000-000000000024', 'ON Nusa Penida Tour',
   'Experience the island''s rugged beauty after the day-trippers leave',
   'Nature', 'https://beyondbalitours.my.canva.site/on-nusa-penida-tour', 24),
  ('t0000000-0000-0000-0000-000000000025', 'ON Gili Trawangan Snorkeling Tour',
   'Crystal clear waters and turtle encounters with a night in paradise',
   'Nature', 'https://beyondbalitours.my.canva.site/on-gili-t-snorkeling-tour', 25),
  -- WATER
  ('t0000000-0000-0000-0000-000000000026', 'Nusa Penida Snorkeling Tour',
   'Swim with Manta Rays in crystal-clear turquoise waters',
   'Water', 'https://beyondbalitours.my.canva.site/nusa-penida-snorkeling-tour', 26),
  ('t0000000-0000-0000-0000-000000000027', 'Amed Diving Tour',
   'Explore vibrant coral reefs and world-class shipwrecks',
   'Water', 'https://beyondbalitours.my.canva.site/amed-diving-tour', 27),
  ('t0000000-0000-0000-0000-000000000028', 'ON Nusa Penida Snorkeling Tour',
   'Dive deep into the reefs and stay for the epic island sunset',
   'Water', 'https://beyondbalitours.my.canva.site/on-nusa-penida-snorkeling-tour', 28),
  ('t0000000-0000-0000-0000-000000000029', 'ON Gili Trawangan Diving Tour',
   'Explore the Gili world-class dive sites with time to spare for the night market',
   'Water', 'https://beyondbalitours.my.canva.site/on-gili-t-diving-tour', 29),
  ('t0000000-0000-0000-0000-000000000030', 'ON Nusa Penida Diving Tour',
   'A dedicated stay for serious divers looking to spot Manta Rays and Mola Mola',
   'Water', 'https://beyondbalitours.my.canva.site/on-nusa-penida-diving-tour', 30);

-- ─── Tour-City Mappings ────────────────────────────────────────────────────────

insert into tour_cities (tour_id, city_id) values
  -- UBUD tours
  ('t0000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000001'), -- Ubud Elephant Tour
  ('t0000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000001'), -- Ubud ATV Tour
  ('t0000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000001'), -- Ubud Rafting Tour
  ('t0000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000001'), -- Gianyar Tour
  ('t0000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000001'), -- Lempuyang Tour
  ('t0000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000001'), -- Instagram Tour
  ('t0000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001'), -- Jungle Paradise
  ('t0000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001'), -- Sweet Moments
  ('t0000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001'), -- Only Me & You
  -- SEMINYAK tours
  ('t0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002'), -- Sea Sky & Spa
  ('t0000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002'), -- Cute Together
  ('t0000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002'), -- Tanah Lot Tour
  ('t0000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002'), -- Sweet Moments
  ('t0000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000002'), -- Instagram Tour
  ('t0000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002'), -- Only Me & You
  -- CANGGU tours
  ('t0000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003'), -- Tanah Lot Tour
  ('t0000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000003'), -- Mt. Batur Sunrise Jeep Tour
  ('t0000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000003'), -- Mt. Batur Sunset Jeep Tour
  ('t0000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003'), -- Cute Together
  ('t0000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000003'), -- Instagram Tour
  -- ULUWATU & JIMBARAN tours
  ('t0000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004'), -- Uluwatu Tour
  ('t0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004'), -- Sea Sky & Spa
  ('t0000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000004'), -- Tanah Lot Tour
  ('t0000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000004'), -- Instagram Tour
  ('t0000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000004'), -- Mt. Batur Sunset Jeep Tour
  -- NUSA PENIDA tours
  ('t0000000-0000-0000-0000-000000000018', 'c1000000-0000-0000-0000-000000000005'), -- Nusa Penida West Tour
  ('t0000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000005'), -- Nusa Penida East Tour
  ('t0000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000005'), -- Nusa Penida Mix Tour
  ('t0000000-0000-0000-0000-000000000026', 'c1000000-0000-0000-0000-000000000005'), -- Nusa Penida Snorkeling Tour
  ('t0000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000005'), -- Nusa Penida Jumping Tour
  ('t0000000-0000-0000-0000-000000000024', 'c1000000-0000-0000-0000-000000000005'), -- ON Nusa Penida Tour
  ('t0000000-0000-0000-0000-000000000028', 'c1000000-0000-0000-0000-000000000005'), -- ON Nusa Penida Snorkeling Tour
  ('t0000000-0000-0000-0000-000000000030', 'c1000000-0000-0000-0000-000000000005'), -- ON Nusa Penida Diving Tour
  -- SANUR tours
  ('t0000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006'), -- Sweet Moments
  ('t0000000-0000-0000-0000-000000000021', 'c1000000-0000-0000-0000-000000000006'), -- Nusa Lembongan Tour
  ('t0000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000006'), -- Only Me & You
  ('t0000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000006'), -- Instagram Tour
  -- EAST BALI tours
  ('t0000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000007'), -- Lempuyang Tour
  ('t0000000-0000-0000-0000-000000000027', 'c1000000-0000-0000-0000-000000000007'), -- Amed Diving Tour
  ('t0000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000007'), -- Mt. Batur Sunrise Jeep Tour
  ('t0000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000007'), -- Mt. Batur ATV & Jeep Tour
  -- GILI TRAWANGAN tours
  ('t0000000-0000-0000-0000-000000000025', 'c1000000-0000-0000-0000-000000000008'), -- ON Gili Trawangan Snorkeling Tour
  ('t0000000-0000-0000-0000-000000000029', 'c1000000-0000-0000-0000-000000000008'), -- ON Gili Trawangan Diving Tour
  -- NORTH BALI tours
  ('t0000000-0000-0000-0000-000000000022', 'c1000000-0000-0000-0000-000000000009'), -- Lovina Dolphin Tour
  ('t0000000-0000-0000-0000-000000000023', 'c1000000-0000-0000-0000-000000000009'); -- Lovina Dolphin & Farm Tour
