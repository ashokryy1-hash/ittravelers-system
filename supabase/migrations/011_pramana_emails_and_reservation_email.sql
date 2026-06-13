-- Migration 011
-- 1. Add reservation_email column (safe to run even if 010 was already run)
-- 2. Set Ini Vie central reservation email
-- 3. Update all 16 Pramana hotels with correct sales & reservation emails from contract PDF
--
-- PRAMANA CHAIN CONTACTS (from PDF page 1):
--   CEO: I Wayan Suarsa | info@pramanaexperience.com
--   Sales: Ayu Linda Malantika (SSM) | ayulinda@pramanaexperience.com
--   Sales: Ni Wayan Karmini/Ami (SSM) | ami@pramanaexperience.com
--   Sales: Ida Ayu Nyoman Puspita Dewi (SM) | dayu@pramanaexperience.com

ALTER TABLE hms_hotels ADD COLUMN IF NOT EXISTS reservation_email text;

-- ============================================================
-- INI VIE HOSPITALITY — central booking email for all 44 properties
-- ============================================================
UPDATE hms_hotels
SET reservation_email = 'reservation@inivie.com'
WHERE chain = 'Ini Vie Hospitality';

-- ============================================================
-- PRAMANA — property-specific emails (sales = contact_email, reservation = reservation_email)
-- ============================================================

-- 1. Pramana Watu Kurung (Ubud 5★)
--    Sales contact: Mr. Ketut Sumartono | sales@pramanawatukurung.com
--    Reservation: Mrs. Wahyuni | reservation@pramanawatukurung.com
UPDATE hms_hotels SET
  contact_email    = 'sales@pramanawatukurung.com',
  reservation_email = 'reservation@pramanawatukurung.com'
WHERE name ILIKE '%Watu Kurung%' AND chain ILIKE '%Pramana%';

-- 2. Pramana Giri Kusuma (Ubud 4★)
--    Manager: Mr. Junaedi | junaedi@pramanaexperience.com
--    Reservation: Mr. Eko | reservation@pramanagirikusuma.com
UPDATE hms_hotels SET
  contact_email    = 'junaedi@pramanaexperience.com',
  reservation_email = 'reservation@pramanagirikusuma.com'
WHERE name ILIKE '%Giri Kusuma%' AND chain ILIKE '%Pramana%';

-- 3. Pramana Natura Nusa Penida (5★)
--    Manager: Mr. I Wayan Suata | suata@pramanaexperience.com
--    Reservation: Mrs. Ida & Mr. Darmaya | reservation@pramanapenida.com
UPDATE hms_hotels SET
  contact_email    = 'suata@pramanaexperience.com',
  reservation_email = 'reservation@pramanapenida.com'
WHERE name ILIKE '%Natura%' AND chain ILIKE '%Pramana%';

-- 4. Pramana Zahill Kintamani (4★)
--    Manager: Mr. Gede Kurniawan | kurniawan@pramanaexperience.com
--    Reservation: Mrs. Yuni | reservation@pramanazahill.com
UPDATE hms_hotels SET
  contact_email    = 'kurniawan@pramanaexperience.com',
  reservation_email = 'reservation@pramanazahill.com'
WHERE name ILIKE '%Zahill%' AND chain ILIKE '%Pramana%';

-- 5. Pramana Nusa Ceningan (4★)
--    Manager: Mr. Komang Trisna | trisna@pramanaexperience.com
--    Reservation: Ms. Natasha | reservation@pramananusaceningan.com
UPDATE hms_hotels SET
  contact_email    = 'trisna@pramanaexperience.com',
  reservation_email = 'reservation@pramananusaceningan.com'
WHERE name ILIKE '%Ceningan%' AND chain ILIKE '%Pramana%';

-- 6. Kardia Resort Gili (4★)
--    Manager: Mr. I Gde Sukayasa | sukayasa@pramanaexperience.com
--    Reservation: Mr. Bagus Indra | reservation@kardiaresortgili.com
UPDATE hms_hotels SET
  contact_email    = 'sukayasa@pramanaexperience.com',
  reservation_email = 'reservation@kardiaresortgili.com'
WHERE name ILIKE '%Kardia%' AND chain ILIKE '%Pramana%';

-- 7. Sumitra Luxury Villas & Resort (Sanur 5★)
--    Manager: Mr. Yudy | yudy@pramanaexperience.com
--    Reservation: Ms. Cempaka Gita | reservation@sumitrahotels.com
UPDATE hms_hotels SET
  contact_email    = 'yudy@pramanaexperience.com',
  reservation_email = 'reservation@sumitrahotels.com'
WHERE name ILIKE '%Sumitra%' AND chain ILIKE '%Pramana%';

-- 8. Kuwarasan (4★)
--    Manager: Mr. Gusti Putra | gusti.putra@pramanaexperience.com
--    Sales: Ms. Anis | sales@kuwarasan.com
--    Reservation: Ms. Dwi | reservation@kuwarasan.com
UPDATE hms_hotels SET
  contact_email    = 'sales@kuwarasan.com',
  reservation_email = 'reservation@kuwarasan.com'
WHERE name ILIKE '%Kuwarasan%' AND chain ILIKE '%Pramana%';

-- 9. The Alena Resort (5★)
--    Manager: Mrs. Indra Foresty | indra@pramanaexperience.com
--    Reservation: Mrs. Erika | reservation@thealenaresort.com
UPDATE hms_hotels SET
  contact_email    = 'indra@pramanaexperience.com',
  reservation_email = 'reservation@thealenaresort.com'
WHERE name ILIKE '%Alena%' AND chain ILIKE '%Pramana%';

-- 10. thewakanda (5★)
--     Manager: Mr. Wayan Tagel | wayan.tagel@pramanaexperience.com
--     Sales: Ms. Mita | sales@wakandaubud.com
--     Reservation: Ms. Risma Widya | reservation@wakandaubud.com
UPDATE hms_hotels SET
  contact_email    = 'sales@wakandaubud.com',
  reservation_email = 'reservation@wakandaubud.com'
WHERE name ILIKE '%wakanda%' AND chain ILIKE '%Pramana%';

-- 11. The Hava Ubud (5★)
--     Manager: Mr. Windu Suputra | windu@pramanaexperience.com
--     Reservation: Ms. Ari & Ms. Erna | rsv@thehavaubud.com
UPDATE hms_hotels SET
  contact_email    = 'windu@pramanaexperience.com',
  reservation_email = 'rsv@thehavaubud.com'
WHERE name ILIKE '%Hava%' AND chain ILIKE '%Pramana%';

-- 12. Sanna Ubud (5★)
--     Manager: Mr. I Made Muliadi | muliadi@pramanaexperience.com
--     Reservation: Ms. Windi | reservation@sannaubud.com
UPDATE hms_hotels SET
  contact_email    = 'muliadi@pramanaexperience.com',
  reservation_email = 'reservation@sannaubud.com'
WHERE name ILIKE '%Sanna%' AND chain ILIKE '%Pramana%';

-- 13. Seven Dreams Nusa Penida (5★)
--     Manager: Mr. I Wayan Garutma Utama | garutma@pramanaexperience.com
--     Reservation: Ms. Laras | Reservation@sevendreamsnusapenida.com
UPDATE hms_hotels SET
  contact_email    = 'garutma@pramanaexperience.com',
  reservation_email = 'reservation@sevendreamsnusapenida.com'
WHERE name ILIKE '%Seven Dreams%' AND chain ILIKE '%Pramana%';

-- 14. Swan Paradise (4★)
--     Manager: Mr. I Putu Gede Arjana Putra | putu.arjana@pramanaexperience.com
--     Sales: Ms. Kadek Karina | sales@swanparadisebali.com
--     Reservation: Ms. Tirta (phone only — use sales email)
UPDATE hms_hotels SET
  contact_email    = 'sales@swanparadisebali.com',
  reservation_email = 'sales@swanparadisebali.com'
WHERE name ILIKE '%Swan Paradise%' AND chain ILIKE '%Pramana%';

-- 15. Tapa Tepi Kali Canggu (3★)
--     Manager: Mr. Deny Irawan | deni@pramanaexperience.com
--     Reservation: Mrs. Novy | reservation@tapatepikali.com
UPDATE hms_hotels SET
  contact_email    = 'deni@pramanaexperience.com',
  reservation_email = 'reservation@tapatepikali.com'
WHERE name ILIKE '%Tapa Tepi%' AND chain ILIKE '%Pramana%';

-- 16. Tapa Agung View Karangasem (3★)
--     Manager: Mr. Nengah Suardika | suardika@pramanaexperience.com
--     Reservation: Mr. Agus Wiranatha | reservation@tapaagung.com
UPDATE hms_hotels SET
  contact_email    = 'suardika@pramanaexperience.com',
  reservation_email = 'reservation@tapaagung.com'
WHERE name ILIKE '%Tapa Agung%' AND chain ILIKE '%Pramana%';

-- ============================================================
-- VERIFY — show all updated rows
-- ============================================================
SELECT
  chain,
  name,
  contact_email   AS sales_email,
  reservation_email
FROM hms_hotels
WHERE reservation_email IS NOT NULL
ORDER BY chain, name;
