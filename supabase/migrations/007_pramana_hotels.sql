-- Pramana Experience hotels — contract 2026/2027
-- 16 properties across Bali & Gili Trawangan
-- photo_link_url = main Drive folder (update per hotel via admin with individual subfolder links)

insert into explorer_hotels
  (city_id, name, star_rating, chain, room_types, photo_link_url, notes, sort_order)
values

-- ── UBUD & SURROUNDS ──────────────────────────────────────────────────────────

('b0000000-0000-0000-0000-000000000001',
 'Pramana Watu Kurung', 5, 'Pramana',
 '["Pramana Suite","Ayung Valley Suite","Wooden Pool Villa","Artist Pool Villa","Royal Ayung Pool Villa","Luxury Valley Villa with Infinity Pool"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Adults only (15+). Kedewatan, Ubud. Ayung River valley views. Daily yoga, village walk & cycling, shuttle to Ubud center. 1-hour spa for 3-night stay.',
 44),

('b0000000-0000-0000-0000-000000000001',
 'Pramana Giri Kusuma', 4, 'Pramana',
 '["Suite Jungle Lodge","River Suite","One Bedroom Jungle Villa","Two Bedroom Jungle Pool"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Adults only (12+). Payangan, Ubud. Holy canyon & spring water on site. Afternoon tea included. Canyon trekking & yoga available.',
 45),

('b0000000-0000-0000-0000-000000000001',
 'Kuwarasan A Pramana Experience', 4, 'Pramana',
 '["Suite Pool View","Suite Paddies View","One Bedroom Pool Villa","Presidential Suite"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Tegallalang, Ubud. Rice paddy views. Daily yoga & morning walk. Wine + minibar included for pool villa. Presidential Suite includes sparkling wine + handbag on arrival.',
 46),

('b0000000-0000-0000-0000-000000000001',
 'The Alena Resort A Pramana Experience', 5, 'Pramana',
 '["Deluxe Room","Super Deluxe Room","Luxury Suite Room","Classic 1-Bedroom Private Pool Villa","Luxury 1-Bedroom Private Pool Villa","Luxury Royal 1-Bedroom Private Pool Villa with Jacuzzi"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Lodtunduh, Ubud. Afternoon tea, yoga, rice field trekking, bicycles included. Two pools (classic + luxury jacuzzi). Sauna, gym, spa.',
 47),

('b0000000-0000-0000-0000-000000000001',
 'thewakanda A Pramana Experience', 5, 'Pramana',
 '["Junior Suite Room","Premiere Suite Room","Royal Wakanda Room","One Bedroom Paddies Pool Villa","One Bedroom Authentic Pool Villa"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Adults only (12+). No extra beds. Kemenuh, Ubud. Rice paddy views. Floating breakfast + local wine for villa categories. Hatta yoga & rice field trekking included.',
 48),

('b0000000-0000-0000-0000-000000000001',
 'The Hava Ubud A Pramana Experience', 5, 'Pramana',
 '["Deluxe Room","Hava Room","Suite Room","Suite Room with Pool"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Penestanan, Ubud. Afternoon tea, yoga, rice field trekking. Gym & spa. Meeting room available.',
 49),

('b0000000-0000-0000-0000-000000000001',
 'Sanna Ubud A Pramana Experience', 5, 'Pramana',
 '["Jungle Terrace Pool Villa","Jungle Suite Pool Villa","Butler Valley Pool Villa","Two Storey Pool Villa"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Adults only (18+). All-villa resort. Tegallalang, Ubud. Butler service for higher categories. Private Beji holy spring on site. Niti Wine Bar.',
 50),

-- ── NUSA PENIDA & CENINGAN ───────────────────────────────────────────────────

('b0000000-0000-0000-0000-000000000005',
 'Pramana Natura Nusa Penida', 5, 'Pramana',
 '["Suite Ocean View","One Bedroom Villa Ocean View","One Bedroom Royal Pool Villa Ocean View"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Adults only (12+). Ocean views. Afternoon tea, spa, daily Balinese activities. Island tours & snorkeling available as add-ons.',
 51),

('b0000000-0000-0000-0000-000000000005',
 'Pramana Nusa Ceningan', 4, 'Pramana',
 '["Seaside Wooden Lodge","Seaview Wooden Lodge"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Adults only (12+). Private beach & 156m pool. Afternoon tea included. Shuttle to Yellow Bridge & Bias Muncul Harbor.',
 52),

('b0000000-0000-0000-0000-000000000005',
 'Seven Dreams A Pramana Experience', 5, 'Pramana',
 '["One Bedroom Garden Villa","One Bedroom Private Pool Villa","Beach Front Sunrise Royal Two Bedroom Pool Villa","Beach Front Signature Royal Three Bedroom Pool Villa"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Beachfront, Nusa Penida east coast. Free canoe & snorkeling equipment. Champagne + free harbor transfers for royal villa categories. 10% early bird (book 30 days ahead).',
 53),

-- ── EAST BALI ────────────────────────────────────────────────────────────────

('b0000000-0000-0000-0000-000000000007',
 'Pramana Zahill Kintamani', 4, 'Pramana',
 '["Deluxe Garden View","Deluxe Glamping","Deluxe Pool View","Suite Pool View","1 Bedroom Private Pool Villa","3 Bedroom Private Pool Villa"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Kintamani. Heated pool + campfire access included. Mt. Batur sunrise trekking & Jeep tours available. Kids-friendly (0–3 free). Ballroom for events.',
 54),

('b0000000-0000-0000-0000-000000000007',
 'Swan Paradise A Pramana Experience', 4, 'Pramana',
 '["Superior","Deluxe","One Bedroom Garden Suite","Two Bedroom Garden Villa","Three Bedroom Garden Villa with Pool Access","Three Bedroom Private Pool Villa"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Saba, Gianyar. Daily shuttle to Keramas Beach, Ubud & Sanur. Afternoon tea included. Gym, conference hall. 10% early bird (book 30 days ahead).',
 55),

('b0000000-0000-0000-0000-000000000007',
 'Tapa Agung View by Pramana', 3, 'Pramana',
 '["Standard Room with Garden View","Deluxe Room with Mountain View","One Bedroom Bungalow","Suite Pool Access"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Besakih / Karangasem. Views of Mt. Agung & Besakih temple. Most affordable Pramana option. Daily Balinese activities.',
 56),

-- ── SANUR ────────────────────────────────────────────────────────────────────

('b0000000-0000-0000-0000-000000000006',
 'Sumitra Luxury Villas & Resort by Pramana', 5, 'Pramana',
 '["Luxury Suite Garden View","Luxury Suite Sea View","Grand Suite Ocean View","Infinity Sky Pool Villa Garden View","Infinity Sky Pool Villa Sea View","Presidential Two Bedroom Pool Villa","Beach Front Luxury One Bedroom Private Pool Villa","Beach Front Luxury Two Bedroom Private Pool Villa"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Sanur beachfront. Lazy river, kids club, gym, sky lounge, wedding chapel. Yoga & Balinese activities included. Most premium Pramana property.',
 57),

-- ── CANGGU ───────────────────────────────────────────────────────────────────

('b0000000-0000-0000-0000-000000000003',
 'Tapa Tepi Kali Canggu by Pramana', 3, 'Pramana',
 '["Deluxe Pool View","Deluxe Pool Access","Deluxe Riverside Garden","One Bedroom Villa","Two Bedroom Pool Villa","Three Bedroom Pool Villa"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Echo Beach, Canggu. Riverside setting. Afternoon tea included. 10% early bird discount (30 days in advance).',
 58),

-- ── GILI TRAWANGAN ───────────────────────────────────────────────────────────

('b0000000-0000-0000-0000-000000000008',
 'Kardia Resort Gili A Pramana Experience', 4, 'Pramana',
 '["Suite Garden View","Suite Ocean View","Suite Pool Access","One Bedroom Private Pool Villa"]'::jsonb,
 'https://drive.google.com/drive/folders/19Imsu27R9MMDEFtdiSykWAt1sUumyxzY',
 'Sunset Point, Gili Trawangan. Private beach (conservation coral — no swimming). Afternoon tea for pool categories. Weekly cultural dinners: Lombok Wed, BBQ Fri, RASA YATRA Sun.',
 59);
