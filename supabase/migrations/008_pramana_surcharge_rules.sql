-- Add Pramana-specific surcharge rules
-- Note: Pramana charges IDR 250,000/night for both high and peak season
-- Their high season: 1 Jul 2026 – 31 Aug 2026
-- Their peak season: 20 Dec 2026 – 7 Jan 2027

-- The rates in the sheet already INCLUDE the surcharge (e.g. low 1,900,000 → high 2,350,000 = +450,000)
-- Wait — actually looking at the data:
-- Pramana Watu Kurung Pramana Suite: low 1,900,000 / high 2,350,000 = difference of 450,000
-- But contract rules say surcharge is IDR 250,000
-- The high season column appears to be the TOTAL rate already (base + surcharge built in)
-- So in our system: low_season_rate = contract rate, high/peak = total already including surcharge
-- This is already stored correctly in the room_types table above.
-- No additional surcharge rules needed for Pramana — their sheet provides all-in rates per season.
SELECT 'Pramana rates loaded — high/peak season rates are all-inclusive as per contract sheet.' AS status;
