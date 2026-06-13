-- Add reservation_email column to hms_hotels
-- This is the email address to use for booking/availability requests
-- contact_email remains as the sales/contract contact
-- reservation_email is the operational booking inbox

ALTER TABLE hms_hotels ADD COLUMN IF NOT EXISTS reservation_email text;

-- ============================================================
-- INI VIE HOSPITALITY — central booking email for all properties
-- ============================================================
UPDATE hms_hotels
SET reservation_email = 'reservation@inivie.com'
WHERE chain = 'Ini Vie Hospitality';

-- ============================================================
-- PRAMANA GROUP — central reservation email
-- (Update with correct email once Pramana PDF is reviewed)
-- ============================================================
-- UPDATE hms_hotels
-- SET reservation_email = 'reservation@pramanagroup.com'
-- WHERE chain = 'Pramana Group';

SELECT
  name,
  contact_email AS sales_email,
  reservation_email
FROM hms_hotels
WHERE reservation_email IS NOT NULL
ORDER BY chain, name;
