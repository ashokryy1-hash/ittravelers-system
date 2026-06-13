-- Pramana Group Hotels & Room Types
-- Contract validity: 1 April 2026 – 31 March 2027
-- High season surcharge: IDR 250,000/room/night (1 Jul 2026 – 31 Aug 2026)
-- Peak season surcharge: IDR 250,000/room/night (20 Dec 2026 – 7 Jan 2027)
-- All rates in IDR, BB meal plan assumed

DO $$
DECLARE
  bali_id uuid;
  h_id uuid;
BEGIN
  SELECT id INTO bali_id FROM hms_destinations WHERE name = 'Bali' LIMIT 1;

  -- ============================================================
  -- 1. Pramana Watu Kurung — Ubud, 5*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Pramana Watu Kurung', bali_id, 'Ubud', 5, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High season surcharge IDR 250,000/night. Peak season surcharge IDR 250,000/night. Min 25% markup if published publicly.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Pramana Suite',                          'room',  1900000, 2350000, 2350000, 'IDR', 'BB', 0),
    (h_id, 'Ayung Valley Suite',                     'room',  2800000, 3250000, 3250000, 'IDR', 'BB', 1),
    (h_id, 'Wooden Pool Villa',                      'villa', 4100000, 4550000, 4550000, 'IDR', 'BB', 2),
    (h_id, 'Artist Pool Villa',                      'villa', 4100000, 4550000, 4550000, 'IDR', 'BB', 3),
    (h_id, 'Royal Ayung Pool Villa',                 'villa', 6600000, 7050000, 7050000, 'IDR', 'BB', 4),
    (h_id, 'Luxury Valley Villa with Infinity Pool', 'villa', 7000000, 7450000, 7450000, 'IDR', 'BB', 5);

  -- ============================================================
  -- 2. Pramana Giri Kusuma — Ubud/Payangan, 4*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Pramana Giri Kusuma', bali_id, 'Ubud', 4, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'Area: Ubud / Payangan. High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Suite Jungle Lodge',        'room',  1550000, 2000000, 2000000, 'IDR', 'BB', 0),
    (h_id, 'River Suite',               'room',  1875000, 2325000, 2325000, 'IDR', 'BB', 1),
    (h_id, 'One Bedroom Jungle Villa',  'villa', 2800000, 3250000, 3250000, 'IDR', 'BB', 2),
    (h_id, 'Two Bedroom Jungle Pool',   'villa', 5500000, 5950000, 5950000, 'IDR', 'BB', 3);

  -- ============================================================
  -- 3. Pramana Natura Nusa Penida — Nusa Penida, 5*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Pramana Natura Nusa Penida', bali_id, 'Nusa Penida', 5, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Suite Ocean View',                        'room',  2500000, 3050000, 3050000, 'IDR', 'BB', 0),
    (h_id, 'One Bedroom Villa Ocean View',            'villa', 4500000, 5050000, 5050000, 'IDR', 'BB', 1),
    (h_id, 'One Bedroom Royal Pool Villa Ocean View', 'villa', 7500000, 8050000, 8050000, 'IDR', 'BB', 2);

  -- ============================================================
  -- 4. Pramana Zahill Kintamani — Kintamani, 4*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Pramana Zahill Kintamani', bali_id, 'Kintamani', 4, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Deluxe Garden View (2 Twin)',    'room',   800000, 1050000, 1050000, 'IDR', 'BB', 0),
    (h_id, 'Deluxe Glamping',               'room',   800000, 1050000, 1050000, 'IDR', 'BB', 1),
    (h_id, 'Deluxe Pool View (4 Twin)',      'room',   950000, 1200000, 1200000, 'IDR', 'BB', 2),
    (h_id, 'Suite Pool View',               'room',  1200000, 1450000, 1450000, 'IDR', 'BB', 3),
    (h_id, '1 Bedroom Private Pool Villa',  'villa', 2100000, 2350000, 2350000, 'IDR', 'BB', 4),
    (h_id, '3 Bedroom Private Pool Villa',  'villa', 3500000, 3750000, 3750000, 'IDR', 'BB', 5);

  -- ============================================================
  -- 5. Pramana Nusa Ceningan — Nusa Ceningan, 4*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Pramana Nusa Ceningan', bali_id, 'Nusa Ceningan', 4, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'Area: Nusa Ceningan / Lembongan. High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Seaside Wooden Lodge (1 Twin)', 'room', 1350000, 1900000, 1900000, 'IDR', 'BB', 0),
    (h_id, 'Seaview Wooden Lodge',          'room', 1550000, 2100000, 2100000, 'IDR', 'BB', 1);

  -- ============================================================
  -- 6. Kardia Resort Gili (A Pramana Experience) — Gili Trawangan, 4*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Kardia Resort Gili A Pramana Experience', bali_id, 'Gili Trawangan', 4, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Suite Garden View (Down Stair) (3 Twin)', 'room',  1675000, 2475000, 2475000, 'IDR', 'BB', 0),
    (h_id, 'Suite Ocean View (Up Stair) (3 Twin)',    'room',  1890000, 2690000, 2690000, 'IDR', 'BB', 1),
    (h_id, 'Suite Pool Access',                       'room',  2750000, 3550000, 3550000, 'IDR', 'BB', 2),
    (h_id, 'One Bedroom Private Pool Villa',          'villa', 3800000, 4600000, 4600000, 'IDR', 'BB', 3);

  -- ============================================================
  -- 7. Sumitra Luxury Villas & Resort by Pramana — Sanur, 5*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Sumitra Luxury Villas & Resort by Pramana', bali_id, 'Sanur', 5, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Luxury Suite Garden View',                            'room',   3750000,  4500000,  4500000, 'IDR', 'BB', 0),
    (h_id, 'Luxury Suite Sea View',                               'room',   4250000,  5000000,  5000000, 'IDR', 'BB', 1),
    (h_id, 'Grand Suite Ocean View',                              'room',   6500000,  7250000,  7250000, 'IDR', 'BB', 2),
    (h_id, 'Infinity Sky Pool Villa Garden View',                 'villa',  8500000,  9600000,  9600000, 'IDR', 'BB', 3),
    (h_id, 'Infinity Sky Pool Villa Sea View',                    'villa', 10500000, 11600000, 11600000, 'IDR', 'BB', 4),
    (h_id, 'Presidential Two Bedroom Pool Villa',                 'villa', 22500000, 23600000, 23600000, 'IDR', 'BB', 5),
    (h_id, 'Beach Front Luxury One Bedroom Private Pool Villa',   'villa',  9500000, 10600000, 10600000, 'IDR', 'BB', 6),
    (h_id, 'Beach Front Luxury Two Bedroom Private Pool Villa',   'villa', 16500000, 17600000, 17600000, 'IDR', 'BB', 7);

  -- ============================================================
  -- 8. Kuwarasan A Pramana Experience — Ubud/Tegallalang, 4*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Kuwarasan A Pramana Experience', bali_id, 'Ubud', 4, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'Area: Ubud / Tegallalang. High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Suite Pool View',         'room',  2200000, 2700000, 2700000, 'IDR', 'BB', 0),
    (h_id, 'Suite Paddies View',      'room',  2700000, 3200000, 3200000, 'IDR', 'BB', 1),
    (h_id, 'One Bedroom Pool Villa',  'villa', 4700000, 5200000, 5200000, 'IDR', 'BB', 2),
    (h_id, 'Presidential Suite',      'room',  8500000, 9000000, 9000000, 'IDR', 'BB', 3);

  -- ============================================================
  -- 9. The Alena Resort A Pramana Experience — Ubud, 5*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('The Alena Resort A Pramana Experience', bali_id, 'Ubud', 5, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Deluxe Room',                                        'room',   1685000,  2185000,  2185000, 'IDR', 'BB', 0),
    (h_id, 'Super Deluxe Room',                                  'room',   1975000,  2475000,  2475000, 'IDR', 'BB', 1),
    (h_id, 'Luxury Suite Room',                                  'room',   2550000,  3050000,  3050000, 'IDR', 'BB', 2),
    (h_id, 'Classic 1-Bedroom Private Pool Villa',               'villa',  3650000,  4150000,  4150000, 'IDR', 'BB', 3),
    (h_id, 'Luxury 1-Bedroom Private Pool Villa',                'villa',  4250000,  4750000,  4750000, 'IDR', 'BB', 4),
    (h_id, 'Luxury Royal 1-Bedroom Private Pool Villa w/Jacuzzi','villa', 12500000, 13000000, 13000000, 'IDR', 'BB', 5);

  -- ============================================================
  -- 10. thewakanda A Pramana Experience — Ubud, 5*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('thewakanda A Pramana Experience', bali_id, 'Ubud', 5, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Junior Suite Room',                  'room',  1575000, 2025000, 2025000, 'IDR', 'BB', 0),
    (h_id, 'Premiere Suite Room',                'room',  2200000, 2650000, 2650000, 'IDR', 'BB', 1),
    (h_id, 'Royal Wakanda Room',                 'room',  3750000, 4200000, 4200000, 'IDR', 'BB', 2),
    (h_id, 'One Bedroom Paddies Pool Villa',     'villa', 3950000, 4400000, 4400000, 'IDR', 'BB', 3),
    (h_id, 'One Bedroom Authentic Pool Villa',   'villa', 4300000, 4750000, 4750000, 'IDR', 'BB', 4);

  -- ============================================================
  -- 11. The Hava Ubud A Pramana Experience — Ubud, 5*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('The Hava Ubud A Pramana Experience', bali_id, 'Ubud', 5, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Deluxe Room (Twin-2units)', 'room', 1750000, 2200000, 2200000, 'IDR', 'BB', 0),
    (h_id, 'Hava Room',                'room', 1975000, 2425000, 2425000, 'IDR', 'BB', 1),
    (h_id, 'Suite Room',               'room', 2750000, 3200000, 3200000, 'IDR', 'BB', 2),
    (h_id, 'Suite Room with Pool',     'villa',3250000, 3700000, 3700000, 'IDR', 'BB', 3);

  -- ============================================================
  -- 12. Sanna Ubud A Pramana Experience — Ubud/Tegallalang, 5*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Sanna Ubud A Pramana Experience', bali_id, 'Ubud', 5, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'Area: Ubud / Tegallalang. High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Jungle Terrace Pool Villa', 'villa',  6050000,  6650000,  6650000, 'IDR', 'BB', 0),
    (h_id, 'Jungle Suite Pool Villa',   'villa',  6500000,  7100000,  7100000, 'IDR', 'BB', 1),
    (h_id, 'Butler Valley Pool Villa',  'villa',  7950000,  8550000,  8550000, 'IDR', 'BB', 2),
    (h_id, 'Two Storey Pool Villa',     'villa', 13550000, 14150000, 14150000, 'IDR', 'BB', 3);

  -- ============================================================
  -- 13. Seven Dreams A Pramana Experience — Nusa Penida, 5*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Seven Dreams A Pramana Experience', bali_id, 'Nusa Penida', 5, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'One Bedroom Garden Villa',                                  'villa',  3000000,  3750000,  3750000, 'IDR', 'BB', 0),
    (h_id, 'One Bedroom Private Pool Villa',                            'villa',  5000000,  5750000,  5750000, 'IDR', 'BB', 1),
    (h_id, 'Beach Front Sunrise Royal Two Bedroom Pool Villa',          'villa', 18500000, 19250000, 19250000, 'IDR', 'BB', 2),
    (h_id, 'Beach Front Signature Royal Three Bedroom Pool Villa',      'villa', 25500000, 26250000, 26250000, 'IDR', 'BB', 3);

  -- ============================================================
  -- 14. Swan Paradise A Pramana Experience — Gianyar/Saba, 4*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Swan Paradise A Pramana Experience', bali_id, 'Sanur', 4, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'Area: Gianyar / Saba. High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Superior',                               'room',  1435000, 1835000, 1835000, 'IDR', 'BB', 0),
    (h_id, 'Deluxe',                                 'room',  1775000, 2175000, 2175000, 'IDR', 'BB', 1),
    (h_id, 'One Bedroom Garden Suite',               'room',  2410000, 2810000, 2810000, 'IDR', 'BB', 2),
    (h_id, 'Two Bedroom Garden Villa',               'villa', 4265000, 4665000, 4665000, 'IDR', 'BB', 3),
    (h_id, 'Three Bedroom Garden Villa w/Pool Access','villa', 6415000, 6815000, 6815000, 'IDR', 'BB', 4),
    (h_id, 'Three Bedroom Private Pool Villa',       'villa', 7765000, 8165000, 8165000, 'IDR', 'BB', 5);

  -- ============================================================
  -- 15. Tapa Tepi Kali Canggu by Pramana — Canggu, 3*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Tapa Tepi Kali Canggu by Pramana', bali_id, 'Canggu', 3, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Deluxe Pool View',         'room',  925000, 1300000, 1300000, 'IDR', 'BB', 0),
    (h_id, 'Deluxe Pool Access',       'room', 1075000, 1450000, 1450000, 'IDR', 'BB', 1),
    (h_id, 'Deluxe Riverside Garden',  'room', 1250000, 1625000, 1625000, 'IDR', 'BB', 2),
    (h_id, 'One Bedroom Villa',        'villa',1525000, 1900000, 1900000, 'IDR', 'BB', 3),
    (h_id, 'Two Bedroom Pool Villa',   'villa',2675000, 3050000, 3050000, 'IDR', 'BB', 4),
    (h_id, 'Three Bedroom Pool Villa', 'villa',3725000, 4100000, 4100000, 'IDR', 'BB', 5);

  -- ============================================================
  -- 16. Tapa Agung View by Pramana — Karangasem, 3*
  -- ============================================================
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status, valid_from, valid_to, surcharge_waiver, notes)
  VALUES ('Tapa Agung View by Pramana', bali_id, 'Karangasem', 3, 'Pramana Group', 'Active', '2026-04-01', '2027-03-31', 'none',
    'Area: Karangasem / Besakih. High & peak season surcharge IDR 250,000/night.')
  RETURNING id INTO h_id;

  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, high_season_rate, peak_season_rate, currency, meal_plan, sort_order) VALUES
    (h_id, 'Standard Room with Garden View (3 Twin)',  'room',  750000, 1150000, 1150000, 'IDR', 'BB', 0),
    (h_id, 'Deluxe Room with Mountain View (6 Twin)', 'room', 1150000, 1550000, 1550000, 'IDR', 'BB', 1),
    (h_id, 'One Bedroom Bungalow',                    'room', 1285000, 1685000, 1685000, 'IDR', 'BB', 2),
    (h_id, 'Suite Pool Access',                       'room', 1550000, 1950000, 1950000, 'IDR', 'BB', 3);

END $$;
