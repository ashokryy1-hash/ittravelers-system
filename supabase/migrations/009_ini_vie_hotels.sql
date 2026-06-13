-- Ini Vie Hospitality — Campaign Promotion Q2 Net Rates
-- Booking Window: 01 June 2026 – 30 September 2026
-- Stay Period: 01 June 2026 – 30 April 2027
-- Central contact: reservation@inivie.com | +62 811-3986-889
-- Signed by: Charly Putra, Director of Sales
--
-- Surcharge rules (already in system from migration 006):
--   High Season: 01 Jul–31 Aug 2026 & 07–12 Mar 2027 → Room IDR 450,000 | Villa IDR 700,000
--   Peak Season: 23 Dec 2026–05 Jan 2027 → Room IDR 600,000 | Villa IDR 800,000
--   50% waiver → Room IDR 225,000 | Villa IDR 350,000
--   100% waiver → IDR 0
--
-- All rates stored are LOW SEASON rates. System applies surcharge automatically.
-- Meal plan BB unless noted as RO (Room Only).

DO $$
DECLARE
  bali_id uuid;
  h_id uuid;
BEGIN
  SELECT id INTO bali_id FROM hms_destinations WHERE name = 'Bali' LIMIT 1;

  -- ============================================================
  -- UBUD AREA
  -- ============================================================

  -- 1. Equipoise Resort Ubud ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Equipoise Resort Ubud', bali_id, 'Ubud', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'Equipoiseresort@inivie.com', 'none',
    'Check-out 12:00 noon. Children under 11 not permitted.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool — Prestige Experience', 'villa', 5350000, 'IDR', 'BB', 9, 0),
    (h_id, 'One Bedroom Villa Private Pool Ricefield View — Prestige Experience', 'villa', 6050000, 'IDR', 'BB', 9, 1),
    (h_id, 'Presidential Suite', 'room', 9100000, 'IDR', 'BB', 1, 2);

  -- 2. Aksari Luxury Resort & Spa Ubud ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Aksari Luxury Resort & Spa Ubud', bali_id, 'Ubud', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@aksariubud.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Suite Forest View (double or twin)', 'room', 2750000, 'IDR', 'BB', 22, 0),
    (h_id, 'Grand One Bedroom Villa with Private Pool', 'villa', 6050000, 'IDR', 'BB', 5, 1),
    (h_id, 'Grand One Bedroom River View Villa with Private Pool', 'villa', 6600000, 'IDR', 'BB', 4, 2),
    (h_id, 'Grand Two Bedroom River View Villa with Private Pool', 'villa', 7950000, 'IDR', 'BB', 1, 3);

  -- 3. Asvara Villa Ubud ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Asvara Villa Ubud', bali_id, 'Ubud', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@asvaravilla.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Royal One Bedroom Villa with Private Pool and Jacuzzi', 'villa', 2150000, 'IDR', 'BB', 21, 0),
    (h_id, 'Grand One Bedroom Ricefield View Villa with Private Pool and Jacuzzi', 'villa', 2400000, 'IDR', 'BB', 5, 1),
    (h_id, 'Royal Two Bedroom Villa with Private Pool and Jacuzzi', 'villa', 3750000, 'IDR', 'BB', 1, 2);

  -- 4. Asvara Luxury Resort & Spa Ubud ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Asvara Luxury Resort & Spa Ubud', bali_id, 'Ubud', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@asvararesort.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool and Jacuzzi', 'villa', 2500000, 'IDR', 'BB', 17, 0),
    (h_id, 'Two Bedroom Villa with Private Pool and Jacuzzi', 'villa', 4200000, 'IDR', 'BB', 1, 1);

  -- 5. Kaamala Luxury Resort & Spa Ubud ★★★★★
  -- Note: Mixed waiver — Grand Suites (Valley/Ricefield/Lagoon) and Rice Field View Villa = 100% waiver
  -- Suite Forest View and other villas = standard surcharge
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Kaamala Luxury Resort & Spa Ubud', bali_id, 'Ubud', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@kaamalaresort.com', 'none',
    'Mixed surcharge waiver: Grand Suites (Valley/Ricefield/Lagoon Access) and One Bedroom Villa Rice Field View have 100% high season surcharge waiver. New room types valid from 01 Jul 2026.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, notes, sort_order) VALUES
    (h_id, 'Suite Forest View (Double or Twin Bed)', 'room', 2350000, 'IDR', 'BB', 12, 'Standard surcharge applies', 0),
    (h_id, 'Grand Suite Valley View', 'room', 2700000, 'IDR', 'BB', 8, '100% high season surcharge waiver', 1),
    (h_id, 'Grand Suite Ricefield View', 'room', 2700000, 'IDR', 'BB', 5, '100% high season surcharge waiver', 2),
    (h_id, 'Grand Suite Valley View Lagoon Access', 'room', 3050000, 'IDR', 'BB', 7, '100% high season surcharge waiver', 3),
    (h_id, 'One Bedroom Villa with Private Pool', 'villa', 3500000, 'IDR', 'BB', 4, 'Standard surcharge applies', 4),
    (h_id, 'Grand 1 Bedroom Private Pool Villa with Ricefield View', 'villa', 3800000, 'IDR', 'BB', 9, 'Standard surcharge applies. Valid from 01 Jul 2026.', 5),
    (h_id, 'One Bedroom Villa Private Pool With Rice Field View', 'villa', 3950000, 'IDR', 'BB', 5, '100% high season surcharge waiver. Valid from 01 Jul 2026.', 6),
    (h_id, 'Grand Two Bedroom Private Pool Villa With Ricefields View', 'villa', 6200000, 'IDR', 'BB', 3, 'Standard surcharge applies', 7);

  -- 6. Amarea Resort & Spa Ubud ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Amarea Resort & Spa Ubud', bali_id, 'Ubud', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@amareaubud.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Ubud Room', 'room', 1100000, 'IDR', 'BB', 6, 0),
    (h_id, 'Ubud Suite with Bathtub', 'room', 1250000, 'IDR', 'BB', 4, 1),
    (h_id, 'Ubud Cottage with Bathtub', 'room', 1500000, 'IDR', 'BB', 1, 2),
    (h_id, 'Cottage Room with Pool', 'room', 2200000, 'IDR', 'BB', 2, 3),
    (h_id, 'Smart One Bedroom Villa with Private Pool and Bathtub', 'villa', 2600000, 'IDR', 'BB', 5, 4),
    (h_id, 'Grand One Bedroom Villa with Private Pool and Bathtub', 'villa', 2750000, 'IDR', 'BB', 4, 5),
    (h_id, 'Grand Two Bedroom Loft Forest View Villa with Private Pool', 'villa', 3550000, 'IDR', 'BB', 1, 6),
    (h_id, 'Grand Two Bedroom Villa with Private Pool', 'villa', 4150000, 'IDR', 'BB', 1, 7);

  -- 7. Maar Resort Ubud ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Maar Resort Ubud', bali_id, 'Ubud', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'maarresort@inivie.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Jacuzzi (without pool)', 'room', 2000000, 'IDR', 'BB', 2, 0),
    (h_id, 'Grand One Bedroom Villa Private Pool', 'villa', 2450000, 'IDR', 'BB', 6, 1),
    (h_id, 'Ubud Suite', 'room', 3000000, 'IDR', 'BB', 1, 2),
    (h_id, 'Two Bedroom Villa with Private Pool', 'villa', 4150000, 'IDR', 'BB', 1, 3);

  -- 8. Dedary Resort & Spa Ubud ★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Dedary Resort & Spa Ubud', bali_id, 'Ubud', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@dedaryresort.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool and Bathtub', 'villa', 1900000, 'IDR', 'BB', 6, 0),
    (h_id, 'Grand One Bedroom Garden View Villa with Private Pool and Jacuzzi', 'villa', 2200000, 'IDR', 'BB', 1, 1),
    (h_id, 'One Bedroom Forest View Villa with Private Pool and Bathtub', 'villa', 2350000, 'IDR', 'BB', 2, 2),
    (h_id, 'Grand One Bedroom Garden View Villa with Private Pool and Bathtub', 'villa', 2500000, 'IDR', 'BB', 2, 3),
    (h_id, 'Two Bedroom Villa with Private Pool and Bathtub', 'villa', 3150000, 'IDR', 'BB', 3, 4),
    (h_id, 'Grand Two Bedroom Forest View Villa with Private Pool', 'villa', 4800000, 'IDR', 'BB', 2, 5);

  -- 9. Suara Alam Ubud ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Suara Alam Ubud', bali_id, 'Ubud', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@suaraalamubud.com', 'none',
    'Adults only — no children permitted. Max 2 pax per room. No extra bed available.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, notes, sort_order) VALUES
    (h_id, 'Paddies Room', 'room', 1100000, 'IDR', 'BB', 7, 'Adults only', 0),
    (h_id, 'Grand Suite Room with Bathtub', 'room', 1200000, 'IDR', 'BB', 2, 'Near construction', 1),
    (h_id, 'Jungle Room with Bathtub', 'room', 1900000, 'IDR', 'BB', 1, 'Adults only', 2),
    (h_id, 'Jungle Room Bathtub with Plunge Pool', 'room', 2450000, 'IDR', 'BB', 1, 'Adults only', 3);

  -- ============================================================
  -- KARANGASEM AREA
  -- ============================================================

  -- 10. Hideout Bali ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Hideout Bali', bali_id, 'Karangasem', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@hideoutbali.com', 'none',
    'Boutique resort in Karangasem. Each unit is a unique hideout villa.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Hay House', 'villa', 1500000, 'IDR', 'BB', 1, 0),
    (h_id, 'Hideout Lightroom', 'villa', 1600000, 'IDR', 'BB', 1, 1),
    (h_id, 'Hideout Zen', 'villa', 2000000, 'IDR', 'BB', 1, 2),
    (h_id, 'Bamboo Home', 'villa', 2450000, 'IDR', 'BB', 1, 3),
    (h_id, 'Hideout Bali', 'villa', 2450000, 'IDR', 'BB', 1, 4),
    (h_id, 'Hideout Falcon', 'villa', 2600000, 'IDR', 'BB', 1, 5),
    (h_id, 'Hideout Beehive', 'villa', 3300000, 'IDR', 'BB', 1, 6),
    (h_id, 'Hideout Horizon', 'villa', 3300000, 'IDR', 'BB', 1, 7),
    (h_id, 'Hideout Cocoon', 'villa', 3650000, 'IDR', 'BB', 1, 8),
    (h_id, 'Hideout Tantra', 'villa', 4850000, 'IDR', 'BB', 1, 9),
    (h_id, 'Hideout Reflection', 'villa', 5050000, 'IDR', 'BB', 1, 10),
    (h_id, 'Hideout Element', 'villa', 5650000, 'IDR', 'BB', 1, 11),
    (h_id, 'Hideout Flow', 'villa', 6250000, 'IDR', 'BB', 1, 12),
    (h_id, 'Hideout Leaf', 'villa', 6250000, 'IDR', 'BB', 1, 13);

  -- ============================================================
  -- SEMINYAK AREA
  -- ============================================================

  -- 11. Sini Vie Luxury Resort & Spa Seminyak ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Sini Vie Luxury Resort & Spa Seminyak', bali_id, 'Seminyak', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@sinivievilla.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Smart Suite Room', 'room', 1450000, 'IDR', 'BB', 4, 0),
    (h_id, 'Grand Smart Suite Room (double or twin)', 'room', 1450000, 'IDR', 'BB', 8, 1),
    (h_id, 'Smart One Bedroom Villa with Private Pool and Jacuzzi', 'villa', 2300000, 'IDR', 'BB', 10, 2),
    (h_id, 'Grand Smart One Bedroom Villa with Private Pool and Jacuzzi', 'villa', 2400000, 'IDR', 'BB', 3, 3),
    (h_id, 'Grand Smart One Bedroom Villa with Private Pool Jacuzzi Lagoon Access', 'villa', 2400000, 'IDR', 'BB', 16, 4),
    (h_id, 'Grand Royal Smart 1 Bedroom Villa with Private Pool & Jacuzzi', 'villa', 2550000, 'IDR', 'BB', 3, 5);

  -- 12. Monolocale Luxury Resort & Spa Seminyak ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Monolocale Luxury Resort & Spa Seminyak', bali_id, 'Seminyak', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@monolocalebali.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Seminyak Suite (double or twin)', 'room', 1250000, 'IDR', 'BB', 6, 0),
    (h_id, 'One Bedroom Villa with Private Pool', 'villa', 1950000, 'IDR', 'BB', 16, 1),
    (h_id, 'Royal One Bedroom Villa with Private Pool', 'villa', 2200000, 'IDR', 'BB', 1, 2);

  -- 13. Aksari Seminyak ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Aksari Seminyak', bali_id, 'Seminyak', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@aksariseminyak.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Royal Smart One Bedroom Villa with Private Pool and Jacuzzi', 'villa', 2100000, 'IDR', 'BB', 14, 0);

  -- 14. Astera Seminyak ★★★★★ — 50% HIGH SEASON SURCHARGE WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Astera Seminyak', bali_id, 'Seminyak', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@asteraseminyak.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool and Bathtub', 'villa', 2050000, 'IDR', 'BB', 8, 0),
    (h_id, 'Royal One Bedroom Villa with Private Pool', 'villa', 2200000, 'IDR', 'BB', 4, 1);

  -- 15. Sana Vie Villa ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Sana Vie Villa', bali_id, 'Seminyak', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@sanavievilla.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Grand Smart One Bedroom Villa with Private Pool', 'villa', 2450000, 'IDR', 'BB', 7, 0),
    (h_id, 'Two Bedroom Villa with Private Pool and Bathtub', 'villa', 4400000, 'IDR', 'BB', 2, 1);

  -- 16. Aleva Villa ★★★★★ — 50% HIGH SEASON SURCHARGE WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Aleva Villa', bali_id, 'Seminyak', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@alevavilla.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Royal One Bedroom Villa with Private Pool and Bathtub', 'villa', 2050000, 'IDR', 'BB', 8, 0);

  -- 17. Ayona Villa Seminyak ★★★★★ — 50% HIGH SEASON SURCHARGE WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Ayona Villa Seminyak', bali_id, 'Seminyak', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@ayonavilla.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool and Bathtub', 'villa', 2200000, 'IDR', 'BB', 1, 0),
    (h_id, 'Grand One Bedroom Villa with Private Pool and Bathtub', 'villa', 2400000, 'IDR', 'BB', 5, 1);

  -- 18. Cyrus Villa ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Cyrus Villa', bali_id, 'Seminyak', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@cyrusvilla.com', 'none',
    'Adults only. Max 2 pax per villa. No extra bed.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool and Bathtub', 'villa', 3000000, 'IDR', 'BB', 5, 0),
    (h_id, 'Grand One Bedroom Villa with Private Pool and Bathtub', 'villa', 3250000, 'IDR', 'BB', 5, 1);

  -- 19. Eight Palms ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Eight Palms', bali_id, 'Seminyak', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@eightpalmsvilla.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Two Bedroom Villa with Private Pool and Bathtub', 'villa', 2200000, 'IDR', 'BB', 6, 0),
    (h_id, 'Three Bedroom Villa with Private Pool and Bathtub', 'villa', 2750000, 'IDR', 'BB', 6, 1),
    (h_id, 'Royal Three Bedroom Villa with Private Pool and Jacuzzi', 'villa', 2950000, 'IDR', 'BB', 1, 2),
    (h_id, 'Royal Three Bedroom Waterslide Villa with Private Pool and Jacuzzi', 'villa', 3500000, 'IDR', 'BB', 1, 3);

  -- 20. La Vie Villa ★★★★ — 50% HIGH SEASON SURCHARGE WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('La Vie Villa', bali_id, 'Seminyak', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@lavievilla.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Royal One Bedroom Villa with Private Pool and Bathtub', 'villa', 1650000, 'IDR', 'BB', 8, 0),
    (h_id, 'Grand One Bedroom Villa with Private Pool & Bathtub', 'villa', 1850000, 'IDR', 'BB', 2, 1);

  -- 21. Seminyak Sanctuary ★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Seminyak Sanctuary', bali_id, 'Seminyak', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@seminyaksanctuary.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Grand One Bedroom Villa with Private Pool and Bathtub', 'villa', 1850000, 'IDR', 'BB', 9, 0);

  -- 22. Ini Vie Villa ★★★★ — 50% HIGH SEASON SURCHARGE WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Ini Vie Villa', bali_id, 'Seminyak', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@inivievilla.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Royal One Bedroom Villa with Private Pool and Jacuzzi', 'villa', 1650000, 'IDR', 'BB', 8, 0),
    (h_id, 'Royal Two Bedroom Villa with Private Pool and Jacuzzi', 'villa', 2450000, 'IDR', 'BB', 2, 1);

  -- 23. Palmea Villa Seminyak ★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Palmea Villa Seminyak', bali_id, 'Seminyak', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'palmeavilla@inivie.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool', 'villa', 2050000, 'IDR', 'BB', 4, 0);

  -- ============================================================
  -- CANGGU AREA
  -- ============================================================

  -- 24. Astera Luxury Resort & Spa Canggu ★★★★★ — 50% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Astera Luxury Resort & Spa Canggu', bali_id, 'Canggu', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@asteracanggu.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, notes, sort_order) VALUES
    (h_id, 'Loft Suite Room', 'room', 1350000, 'IDR', 'BB', 4, NULL, 0),
    (h_id, 'Smart One Bedroom Villa with Private Pool', 'villa', 1650000, 'IDR', 'BB', 9, 'Nearby construction', 1),
    (h_id, 'Smart Loft One Bedroom Villa with Private Pool and Jacuzzi', 'villa', 2000000, 'IDR', 'BB', 7, NULL, 2),
    (h_id, 'Smart Royal One Bedroom Villa with Private Pool and Jacuzzi', 'villa', 2200000, 'IDR', 'BB', 3, NULL, 3);

  -- 25. Teratai Villa Canggu ★★★★★ — 50% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Teratai Villa Canggu', bali_id, 'Canggu', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@terataicanggu.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool and Bathtub', 'villa', 1900000, 'IDR', 'BB', 10, 0),
    (h_id, 'Grand One Bedroom Villa with Private Pool and Bathtub', 'villa', 2000000, 'IDR', 'BB', 1, 1),
    (h_id, 'Two Bedroom Villa with Private Pool and Bathtub', 'villa', 2550000, 'IDR', 'BB', 1, 2),
    (h_id, 'Grand Two Bedroom Villa with Private Pool and Bathtub', 'villa', 2650000, 'IDR', 'BB', 1, 3);

  -- 26. Ayona Canggu ★★★★★ — 50% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Ayona Canggu', bali_id, 'Canggu', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@ayonavillacanggu.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Deluxe One Bedroom Villa with Private Pool and Bathtub', 'villa', 2050000, 'IDR', 'BB', 2, 0),
    (h_id, 'One Bedroom Villa with Private Pool and Bathtub', 'villa', 1850000, 'IDR', 'BB', 4, 1),
    (h_id, 'Grand One Bedroom Private Pool Villa with Forest View', 'villa', 2200000, 'IDR', 'BB', 3, 2),
    (h_id, 'Sky One Bedroom Private Pool Villa with Forest View', 'villa', 2400000, 'IDR', 'BB', 3, 3);

  -- 27. Atap Resort Canggu ★★★★★ — 100% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Atap Resort Canggu', bali_id, 'Canggu', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@atapresort.com', '100%', '100% full high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Suite Room', 'room', 1250000, 'IDR', 'BB', 2, 0),
    (h_id, 'One Bedroom Villa with Private Pool', 'villa', 1750000, 'IDR', 'BB', 6, 1),
    (h_id, 'Grand One Bedroom Villa with Private Pool and Jacuzzi', 'villa', 1900000, 'IDR', 'BB', 2, 2);

  -- 28. Canggu Cabana Resort & Spa ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Canggu Cabana Resort & Spa', bali_id, 'Canggu', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@canggucabana.com', 'none',
    'No children under 15, no pets, no drones. Honeymoon/romance resort.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Suite Garden View', 'room', 1200000, 'IDR', 'BB', 2, 0),
    (h_id, 'Suite Double (double or twin)', 'room', 1200000, 'IDR', 'BB', 4, 1),
    (h_id, 'Suite Plunge Pool', 'room', 1450000, 'IDR', 'BB', 1, 2),
    (h_id, 'Cabana Rooftop Seaview', 'room', 1950000, 'IDR', 'BB', 7, 3),
    (h_id, 'Grand Cabana Rooftop Seaview', 'room', 2100000, 'IDR', 'BB', 3, 4),
    (h_id, 'Two Bedroom Loft', 'villa', 2600000, 'IDR', 'BB', 1, 5);

  -- 29. Manca Villa ★★★★ — 100% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Manca Villa', bali_id, 'Canggu', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@mancavilla.com', '100%', '100% full high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Royal One Bedroom Villa with Private Pool and Bathtub', 'villa', 1350000, 'IDR', 'BB', 3, 0),
    (h_id, 'Grand One Bedroom Villa with Private Pool and Bathtub', 'villa', 1450000, 'IDR', 'BB', 3, 1);

  -- 30. Aeera Villa ★★★★ — 100% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Aeera Villa', bali_id, 'Canggu', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@aeeravilla.com', '100%', '100% full high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Suite Room', 'room', 800000, 'IDR', 'BB', 6, 0),
    (h_id, 'Royal Smart One Bedroom Villa with Private Pool and Bathtub', 'villa', 1550000, 'IDR', 'BB', 4, 1);

  -- ============================================================
  -- SANUR AREA
  -- ============================================================

  -- 31. Sanora Villa Sanur ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Sanora Villa Sanur', bali_id, 'Sanur', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@sanorasanur.com', 'none', NULL)
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Two Bedroom Villa with Private Pool and Bathtub', 'villa', 2450000, 'IDR', 'BB', 6, 0);

  -- 32. Seascape Luxury Resort & Spa Sanur ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Seascape Luxury Resort & Spa Sanur', bali_id, 'Sanur', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@seascapesanur.com', 'none',
    'No children under 15, no pets, no drones. Honeymoon/romance resort.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Suite Room', 'room', 1500000, 'IDR', 'BB', 3, 0),
    (h_id, 'Grand Suite Room', 'room', 1750000, 'IDR', 'BB', 5, 1),
    (h_id, 'One Bedroom Villa with Private Pool', 'villa', 2950000, 'IDR', 'BB', 3, 2),
    (h_id, 'Grand One Bedroom Villa with Private Pool', 'villa', 3150000, 'IDR', 'BB', 5, 3);

  -- ============================================================
  -- JIMBARAN & ULUWATU AREA
  -- ============================================================

  -- 33. The Arden Villa Uluwatu ★★★★★ — 50% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('The Arden Villa Uluwatu', bali_id, 'Uluwatu', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'ardenvilla@inivie.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, notes, sort_order) VALUES
    (h_id, 'Suite Room', 'room', 1050000, 'IDR', 'BB', 6, 'Near construction', 0),
    (h_id, 'One Bedroom Villa with Private Pool', 'villa', 2300000, 'IDR', 'BB', 6, NULL, 1);

  -- 34. Seascape Luxury Resort & Spa Uluwatu ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Seascape Luxury Resort & Spa Uluwatu', bali_id, 'Uluwatu', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'seascapeuluwatu@inivie.com', 'none',
    'Adults only for Cabana rooms. No children under 15, no pets, no drones. Honeymoon/romance resort.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, notes, sort_order) VALUES
    (h_id, 'Suite Room', 'room', 1500000, 'IDR', 'BB', 4, NULL, 0),
    (h_id, 'Grand Suite Room', 'room', 1750000, 'IDR', 'BB', 2, NULL, 1),
    (h_id, 'Deluxe Suite Room', 'room', 1950000, 'IDR', 'BB', 4, NULL, 2),
    (h_id, 'Cabana Room with Infinity Pool', 'room', 2750000, 'IDR', 'BB', 5, 'Adults only', 3),
    (h_id, 'Grand Cabana Room with Infinity Pool', 'room', 3000000, 'IDR', 'BB', 4, 'Adults only', 4),
    (h_id, 'Two Bedroom Ocean View with Private Pool', 'villa', 6550000, 'IDR', 'BB', 3, NULL, 5);

  -- 35. The Jimbaran Villa ★★★★ — 50% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('The Jimbaran Villa', bali_id, 'Jimbaran', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@thejimbaranvilla.com', '50%', '50% high season surcharge waiver')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool and Bathtub', 'villa', 1450000, 'IDR', 'BB', 6, 0);

  -- ============================================================
  -- SOLO PROPERTY — CANGGU
  -- ============================================================

  -- 36. Roomates Surf Camp Canggu ★★★ — partial 50% waiver
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Roomates Surf Camp Canggu', bali_id, 'Canggu', 3, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@roomatescanggu.com', '50%',
    'Hostel/surf camp. Bunk beds: high season surcharge IDR 50,000/night. Private rooms: IDR 225,000/night.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Bunk Bed Female Dormitory', 'room', 200000, 'IDR', 'BB', 20, 0),
    (h_id, 'Bunk Bed Mix Dormitory', 'room', 200000, 'IDR', 'BB', 55, 1),
    (h_id, 'Canggu Double Room', 'room', 750000, 'IDR', 'BB', 8, 2),
    (h_id, 'Canggu Twin Room', 'room', 750000, 'IDR', 'BB', 2, 3);

  -- ============================================================
  -- SOLO — FAMILY VILLA (ROOM + BREAKFAST)
  -- ============================================================

  -- 37. La Mira Villa ★★★★ — 100% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('La Mira Villa', bali_id, 'Seminyak', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@lamiravilla.com', '100%',
    '100% full high season surcharge waiver. Family villa with waterslide.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Royal One Bedroom Villa with Private Pool and Waterslide', 'villa', 1650000, 'IDR', 'BB', 3, 0),
    (h_id, 'Royal Two Bedroom Waterslide Villa with Private Pool', 'villa', 2150000, 'IDR', 'BB', 3, 1),
    (h_id, 'Royal Three Bedroom Waterslide Villa with Private Pool and Bathtub', 'villa', 2750000, 'IDR', 'BB', 1, 2);

  -- 38. Kolila Villa Seminyak ★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Kolila Villa Seminyak', bali_id, 'Seminyak', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@kolilavilla.com', 'none', 'Family villa.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Two Bedroom Villa with Private Pool and Bathtub', 'villa', 2200000, 'IDR', 'BB', 1, 0),
    (h_id, 'Three Bedroom Villa with Private Pool and Bathtub', 'villa', 2900000, 'IDR', 'BB', 1, 1);

  -- ============================================================
  -- SOLO — FAMILY VILLA (ROOM ONLY)
  -- ============================================================

  -- 39. Nara Villa Canggu ★★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Nara Villa Canggu', bali_id, 'Canggu', 5, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@naracanggu.com', 'none', 'Room Only. No breakfast included.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Three Bedroom Private Pool Villa', 'villa', 2550000, 'IDR', 'RO', 1, 0),
    (h_id, 'Four Bedroom Private Pool Villa', 'villa', 3200000, 'IDR', 'RO', 1, 1),
    (h_id, 'Five Bedroom Private Pool Villa', 'villa', 4000000, 'IDR', 'RO', 1, 2);

  -- 40. Kanadea Villa ★★★★ — 100% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Kanadea Villa', bali_id, 'Canggu', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@kanadeavilla.com', '100%',
    '100% full high season surcharge waiver. Room Only. No breakfast.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Two Bedroom Villa with Private Pool', 'villa', 1550000, 'IDR', 'RO', 1, 0),
    (h_id, 'Three Bedroom Villa with Private Pool', 'villa', 1900000, 'IDR', 'RO', 1, 1);

  -- 41. Earth Villa ★★★★ — 100% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Earth Villa', bali_id, 'Canggu', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@earthvillacanggu.com', '100%',
    '100% full high season surcharge waiver. Room Only. No breakfast.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool and Bathtub', 'villa', 1650000, 'IDR', 'RO', 2, 0),
    (h_id, 'Two Bedroom Villa with Private Pool and Bathtub', 'villa', 2200000, 'IDR', 'RO', 2, 1);

  -- 42. Canggu Circle ★★★★ — 100% WAIVER
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Canggu Circle', bali_id, 'Canggu', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@canggucircle.com', '100%',
    '100% full high season surcharge waiver. Room Only. No breakfast.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'One Bedroom Villa with Private Pool and Bathtub', 'villa', 1200000, 'IDR', 'RO', 2, 0),
    (h_id, 'Two Bedroom Villa with Private Pool and Bathtub', 'villa', 1550000, 'IDR', 'RO', 2, 1),
    (h_id, 'Royal Two Bedroom Villa with Private Pool', 'villa', 1850000, 'IDR', 'RO', 2, 2),
    (h_id, 'Three Bedroom Villa with Private Pool and Bathtub', 'villa', 2300000, 'IDR', 'RO', 1, 3);

  -- 43. The Vinava Villa ★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('The Vinava Villa', bali_id, 'Canggu', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'thevinavavilla@staysolo.com', 'none', 'Room Only. No breakfast.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Two Bedroom Villa with Private Pool', 'villa', 2200000, 'IDR', 'RO', 4, 0),
    (h_id, 'Three Bedroom Villa with Private Pool', 'villa', 2750000, 'IDR', 'RO', 4, 1);

  -- ============================================================
  -- TABANAN AREA
  -- ============================================================

  -- 44. Cabana Kedungu ★★★★
  INSERT INTO hms_hotels (name, destination_id, city, star_rating, chain, contract_status,
    valid_from, valid_to, booking_window_from, booking_window_to,
    contact_name, contact_email, surcharge_waiver, notes)
  VALUES ('Cabana Kedungu', bali_id, 'Tabanan', 4, 'Ini Vie Hospitality', 'Active',
    '2026-06-01', '2027-04-30', '2026-06-01', '2026-09-30',
    'Charly Putra', 'info@cabanakedungu.com', 'none',
    'Room Only. Includes: free entrance to TT Beach Club and The Jungle Club Bali. Honeymoon freebies: swan towel, greeting card, special bed decoration.')
  RETURNING id INTO h_id;
  INSERT INTO hms_room_types (hotel_id, name, room_category, low_season_rate, currency, meal_plan, availability, sort_order) VALUES
    (h_id, 'Four Bedroom Private Pool Villa', 'villa', 2300000, 'IDR', 'RO', 1, 0),
    (h_id, 'Five Bedroom Private Pool Villa', 'villa', 2900000, 'IDR', 'RO', 1, 1);

END $$;
