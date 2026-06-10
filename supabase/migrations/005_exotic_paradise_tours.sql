-- Exotic Paradise Bali tours (2026 catalog)
-- City IDs: Ubud=b001, Seminyak=b002, Canggu=b003, Uluwatu & Jimbaran=b004,
--            Nusa Penida=b005, Sanur=b006, East Bali=b007, North Bali=b009

insert into explorer_tours (id, name, description, category, tour_link_url, inclusions, exclusions, sort_order) values

-- Adventure / Activity tours
('e1000000-0000-0000-0000-000000000001',
 'ATV Quadbike Adventure 250cc',
 'Ride through Bali''s stunning jungle trails and rice terraces on a powerful 250cc ATV. Perfect for thrill-seekers who want to experience Bali''s natural beauty off the beaten path.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Professional safety briefing","Helmet and safety gear","Qualified guide","Transport within activity area","Refreshments"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 31),

('e1000000-0000-0000-0000-000000000002',
 'UTV Adventure 800cc',
 'Take the wheel of a powerful 800cc UTV side-by-side buggy and conquer Bali''s rugged terrain. Navigate through jungle paths, river crossings, and scenic countryside.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Professional safety briefing","Helmet and safety gear","Qualified guide","Transport within activity area","Refreshments"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 32),

('e1000000-0000-0000-0000-000000000003',
 'White Water Rafting',
 'Paddle through the thrilling rapids of the Ayung or Telaga Waja River surrounded by lush jungle, dramatic gorges, and beautiful waterfalls.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Professional rafting guide","Helmet, life jacket, and paddle","Changing rooms and shower","Lunch or snack","Transport within activity area"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 33),

('e1000000-0000-0000-0000-000000000004',
 'White Water Rafting & ATV Combo',
 'The ultimate adrenaline double: start with a 250cc ATV ride through jungle trails and rice terraces, then conquer the roaring river rapids on a white water rafting adventure.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["ATV safety gear and guide","Rafting helmet, life jacket, and paddle","Changing rooms and shower","Lunch or snack","Transport within activity area"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 34),

('e1000000-0000-0000-0000-000000000005',
 'Fun River Tubing',
 'Float downstream on an inflatable tube through Bali''s jungle rivers. A fun and relaxed way to experience the natural beauty of Bali''s lush interior.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Tube and safety equipment","Professional guide","Changing rooms and shower","Refreshments"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 35),

('e1000000-0000-0000-0000-000000000006',
 'ATV & Fun River Tubing Combo',
 'Combine two of Bali''s most exciting outdoor experiences: an adrenaline-pumping 250cc ATV ride through jungle terrain followed by a relaxing float down a scenic river.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["ATV safety gear and guide","Tube and safety equipment","Changing rooms and shower","Refreshments","Transport within activity area"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 36),

('e1000000-0000-0000-0000-000000000007',
 'Jungle Cart Joyride',
 'Race through Bali''s jungle on a go-kart style cart, navigating exciting tracks surrounded by tropical greenery. Fun for everyone and guaranteed thrills.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Safety briefing","Helmet and safety gear","Track access","Guide assistance"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 37),

('e1000000-0000-0000-0000-000000000008',
 'Sky Streak Zipline',
 'Soar through the jungle canopy on Bali''s exhilarating zipline. Feel the rush as you fly over rice terraces and jungle valleys with stunning views all around.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Safety harness and equipment","Professional guides","Multiple zipline runs","Safety briefing"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 38),

('e1000000-0000-0000-0000-000000000009',
 'Nature Dash Sky Bike',
 'Pedal through the sky on a suspended sky bike high above Bali''s jungle floor. A unique and thrilling experience with breathtaking bird''s-eye views of the surrounding nature.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Safety harness and helmet","Professional guide","Safety briefing","Refreshments"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 39),

('e1000000-0000-0000-0000-000000000010',
 'Electric Cycling Tour',
 'Explore Bali''s countryside effortlessly on an electric bike. Glide through villages, rice terraces, and jungle paths with minimal effort and maximum enjoyment.',
 'Nature',
 'https://www.exoticparadisebali.com',
 '["Electric bike and helmet","Professional cycling guide","Refreshments","Village stop"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 40),

('e1000000-0000-0000-0000-000000000011',
 'Mt. Batur Sunrise Jeep Tour',
 'Watch the sunrise over Mt. Batur from a 4WD jeep without the strenuous hike. Your driver takes you to prime viewpoints as the sky turns golden over the volcanic crater and lake.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Private 4WD jeep","Professional driver","Sunrise viewing","Breakfast at viewpoint"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 41),

('e1000000-0000-0000-0000-000000000012',
 'Mt. Batur Sunrise Trekking',
 'Hike to the summit of Mt. Batur (1,717m) before dawn and witness one of Bali''s most magical sunrises. A challenging but deeply rewarding experience with panoramic views over the caldera.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Certified local trekking guide","Torch and trekking equipment","Breakfast at summit","Transport to trailhead"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Trekking shoes (bring your own)","Gratuities"]'::jsonb,
 42),

('e1000000-0000-0000-0000-000000000013',
 '4x4 WD Buggy Riding',
 'Drive a rugged 4WD buggy through Bali''s most challenging off-road terrain. Navigate mud tracks, river crossings, and jungle trails for an unforgettable adventure.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Safety briefing","Helmet and safety gear","Qualified guide","Refreshments"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 43),

('e1000000-0000-0000-0000-000000000014',
 'Dirt Bike Adventure',
 'Rev up and explore Bali''s rugged countryside on a dirt bike. Ride through volcanic landscapes, jungle tracks, and traditional villages for a raw, authentic Bali experience.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Safety briefing","Helmet and protective gear","Qualified guide","Refreshments"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 44),

('e1000000-0000-0000-0000-000000000015',
 'Paragliding Bali',
 'Soar like a bird over Bali''s dramatic southern coastline. Take off from the Uluwatu cliffs and glide above turquoise waters with stunning ocean panoramas stretching to the horizon.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Tandem flight with certified pilot","Safety briefing","GoPro video of your flight","Transport to launch site"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 45),

('e1000000-0000-0000-0000-000000000016',
 'Bungee Jumping',
 'Take the ultimate leap from a platform over Bali''s spectacular scenery. An unforgettable adrenaline rush that you will be talking about for years.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Safety harness and professional supervision","Certified bungee operator","Certificate of completion","Refreshments"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 46),

('e1000000-0000-0000-0000-000000000017',
 'Private Surf Lesson',
 'Learn to surf on Bali''s famous waves with a private certified instructor. From beginner basics to improving your technique, Canggu''s beach breaks are perfect for all levels.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Certified surf instructor","Surfboard and rash guard","2-hour private lesson","Theory and ocean safety briefing"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 47),

-- Water activities
('e1000000-0000-0000-0000-000000000018',
 'Jetski Adventure',
 'Speed across the sparkling waters off the Bali coast on a powerful jetski. An exhilarating experience with beautiful sea views, ideal for couples and thrill seekers alike.',
 'Water',
 'https://www.exoticparadisebali.com',
 '["Jetski rental","Life jacket","Safety briefing","Spotter boat supervision"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 48),

('e1000000-0000-0000-0000-000000000019',
 'Snorkeling Blue Lagoon & Taman Jepun',
 'Discover the vibrant underwater world of East Bali at Blue Lagoon and Taman Jepun. Crystal-clear waters teeming with tropical fish and stunning coral reefs await.',
 'Water',
 'https://www.exoticparadisebali.com',
 '["Snorkeling mask, fins, and life jacket","Boat to snorkeling sites","Professional guide","Lunch","Transport from Sanur"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 49),

('e1000000-0000-0000-0000-000000000020',
 'Snorkeling with Manta Rays — Nusa Penida',
 'Swim alongside majestic manta rays in the crystal-clear waters of Nusa Penida. This is a bucket-list ocean experience in one of Bali''s most spectacular marine environments.',
 'Water',
 'https://www.exoticparadisebali.com',
 '["Snorkeling gear","Fast boat from Sanur","Professional guide","Life jacket","Refreshments"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Manta ray sightings not guaranteed","Gratuities"]'::jsonb,
 50),

-- Nature / Wildlife
('e1000000-0000-0000-0000-000000000021',
 'Lovina Dolphin Adventure',
 'Set out at sunrise on a traditional outrigger boat to spot wild dolphins in the calm waters off Lovina''s black sand beach in North Bali. A magical, serene experience in nature.',
 'Nature',
 'https://www.exoticparadisebali.com',
 '["Traditional outrigger boat","Early morning departure","Local captain","Dolphin watching","Snorkeling stop"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Dolphin sightings not guaranteed","Gratuities"]'::jsonb,
 51),

-- Horse riding
('e1000000-0000-0000-0000-000000000022',
 'Horse Riding Seminyak',
 'Ride along Seminyak''s beautiful beach on horseback at sunset. A romantic and peaceful experience with stunning views of the Indian Ocean and golden sky.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Horse and helmet","Professional guide","Beach riding session","Safety briefing"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 52),

('e1000000-0000-0000-0000-000000000023',
 'Horse Riding Candidasa',
 'Explore East Bali''s scenic coastline and countryside on horseback. Ride through rice paddies, coastal paths, and quiet villages with a private guide.',
 'Adventure',
 'https://www.exoticparadisebali.com',
 '["Horse and helmet","Professional guide","Scenic riding route","Safety briefing"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 53),

-- Cultural & Unique
('e1000000-0000-0000-0000-000000000024',
 'Camel Adventure',
 'Experience something truly unique in Bali — ride a camel through the grounds of a beautiful resort near Uluwatu with ocean views. A fun and memorable photo opportunity.',
 'Cultural',
 'https://www.exoticparadisebali.com',
 '["Camel ride","Professional handler","Photo opportunity","Safety briefing"]'::jsonb,
 '["Hotel transfers","Personal travel insurance","Gratuities"]'::jsonb,
 54),

-- Day tours — Nusa Penida
('e1000000-0000-0000-0000-000000000025',
 'West Nusa Penida Tour',
 'Visit the iconic sights of West Nusa Penida including Kelingking Beach (T-Rex cliff), Angel''s Billabong, Broken Beach, and Crystal Bay. The most dramatic scenery in Bali.',
 'Nature',
 'https://www.exoticparadisebali.com',
 '["Fast boat from Sanur return","Private car and driver on island","Professional guide","Entrance fees","Snorkeling at Crystal Bay","Lunch"]'::jsonb,
 '["Hotel transfers to Sanur","Personal travel insurance","Gratuities"]'::jsonb,
 55),

('e1000000-0000-0000-0000-000000000026',
 'East Nusa Penida Tour',
 'Explore the natural wonders of East Nusa Penida: Atuh Beach, Diamond Beach, Thousand Island viewpoint, and the famous Tree House. Stunning coastal cliffs and hidden coves.',
 'Nature',
 'https://www.exoticparadisebali.com',
 '["Fast boat from Sanur return","Private car and driver on island","Professional guide","Entrance fees","Lunch"]'::jsonb,
 '["Hotel transfers to Sanur","Personal travel insurance","Gratuities"]'::jsonb,
 56),

('e1000000-0000-0000-0000-000000000027',
 'Nusa Penida Mix Trip',
 'Get the best of both worlds with highlights from both East and West Nusa Penida in one full day. See Kelingking Beach, Crystal Bay, Atuh Beach, and more on this epic island day trip.',
 'Nature',
 'https://www.exoticparadisebali.com',
 '["Fast boat from Sanur return","Private car and driver on island","Professional guide","Entrance fees","Lunch"]'::jsonb,
 '["Hotel transfers to Sanur","Personal travel insurance","Gratuities"]'::jsonb,
 57),

-- Ubud tours
('e1000000-0000-0000-0000-000000000028',
 'Ubud & Art Village Tour',
 'Immerse yourself in the heart of Balinese culture. Visit Ubud''s sacred Monkey Forest, traditional artisan villages, silver and wood carvers, the famous central market, and the royal palace.',
 'Cultural',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional guide","Monkey Forest entrance","Artisan village visits","Ubud Market stop"]'::jsonb,
 '["Hotel transfers","Personal shopping","Lunch","Gratuities"]'::jsonb,
 58),

('e1000000-0000-0000-0000-000000000029',
 'Ubud & Batur Viewpoint Tour',
 'Combine the cultural richness of Ubud with the volcanic grandeur of Mt. Batur. Visit Ubud''s highlights then head to the highland viewpoint for sweeping views over the caldera and lake.',
 'Cultural',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional guide","Mt. Batur viewpoint stop","Ubud highlights","Lunch"]'::jsonb,
 '["Hotel transfers","Personal shopping","Entrance fees","Gratuities"]'::jsonb,
 59),

-- Uluwatu
('e1000000-0000-0000-0000-000000000030',
 'Beach Tour & Uluwatu',
 'A romantic day exploring Bali''s legendary southern peninsula. Visit the clifftop Uluwatu Temple at sunset, watch the mesmerizing Kecak fire dance, and relax on beautiful Jimbaran beach.',
 'Romantic',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional guide","Uluwatu Temple entrance","Kecak fire dance show","Sunset viewing"]'::jsonb,
 '["Hotel transfers","Seafood dinner at Jimbaran (optional)","Personal shopping","Gratuities"]'::jsonb,
 60),

-- East Bali tours
('e1000000-0000-0000-0000-000000000031',
 'Instagram Tour (Lempuyang Temple)',
 'Capture Bali''s most iconic shot at the Gates of Heaven at Lempuyang Temple, reflected perfectly in still water. Also visit Tirta Gangga water palace and East Bali''s stunning scenery.',
 'Cultural',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional guide","Lempuyang Temple entrance","Tirta Gangga visit","Sarong for temple"]'::jsonb,
 '["Hotel transfers","Lunch","Personal shopping","Gratuities"]'::jsonb,
 61),

-- North Bali
('e1000000-0000-0000-0000-000000000032',
 'Banyumala Waterfall Tour',
 'Trek through North Bali''s lush jungle to the breathtaking twin Banyumala Waterfalls. A hidden gem with crystal-clear pools perfect for swimming surrounded by untouched jungle.',
 'Nature',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional trekking guide","Entrance fees","Refreshments"]'::jsonb,
 '["Hotel transfers","Lunch","Personal travel insurance","Gratuities"]'::jsonb,
 62),

('e1000000-0000-0000-0000-000000000033',
 'Sekumpul Waterfall Tour',
 'Journey to Sekumpul, widely considered the most beautiful waterfall in Bali. Trek through jungle and rice terraces to reach these magnificent cascades plunging into a lush valley.',
 'Nature',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional trekking guide","Entrance fees","Refreshments"]'::jsonb,
 '["Hotel transfers","Lunch","Personal travel insurance","Gratuities"]'::jsonb,
 63),

('e1000000-0000-0000-0000-000000000034',
 'Hidden Waterfall Tour',
 'Discover a secret waterfall tucked away in North Bali''s jungle interior. An off-the-beaten-path adventure to a stunning cascade that few tourists ever find.',
 'Nature',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional guide","Entrance fees","Refreshments"]'::jsonb,
 '["Hotel transfers","Lunch","Personal travel insurance","Gratuities"]'::jsonb,
 64),

-- Cultural temples
('e1000000-0000-0000-0000-000000000035',
 'Mother Temple (Besakih) Trip',
 'Visit Pura Besakih, the largest and most sacred Hindu temple complex in Bali, dramatically situated on the slopes of Mt. Agung. A profound spiritual and cultural experience.',
 'Cultural',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional guide","Temple entrance fee","Sarong for temple","Refreshments"]'::jsonb,
 '["Hotel transfers","Lunch","Personal shopping","Gratuities"]'::jsonb,
 65),

-- Ubud nature
('e1000000-0000-0000-0000-000000000036',
 'Ubud & Waterfall Tour',
 'Combine Ubud''s iconic cultural highlights with a refreshing visit to one of Bali''s stunning waterfalls. A perfect mix of culture, nature, and scenery in central Bali.',
 'Nature',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional guide","Waterfall entrance fee","Ubud highlights","Refreshments"]'::jsonb,
 '["Hotel transfers","Lunch","Personal shopping","Gratuities"]'::jsonb,
 66),

-- Ubud VW Safari
('e1000000-0000-0000-0000-000000000037',
 'Ubud VW Safari Tour',
 'Cruise through Bali''s picturesque countryside in a classic open-top VW Beetle or Jeep. Visit rice terraces, temples, and traditional villages in the most stylish way possible.',
 'Cultural',
 'https://www.exoticparadisebali.com',
 '["Classic VW or Jeep with driver","Professional guide","Rice terrace visit","Temple stop","Refreshments"]'::jsonb,
 '["Hotel transfers","Lunch","Personal shopping","Gratuities"]'::jsonb,
 67),

-- Custom
('e1000000-0000-0000-0000-000000000038',
 'Bali Custom Day Tour',
 'Design your perfect Bali day with a fully customizable private tour. Choose your destinations, pace, and interests — your professional guide and driver will make it happen.',
 'Cultural',
 'https://www.exoticparadisebali.com',
 '["Private car and driver","Professional guide","Flexible itinerary","Up to 8 hours"]'::jsonb,
 '["Entrance fees","Meals","Hotel transfers","Personal shopping","Gratuities"]'::jsonb,
 68);

-- ─── Tour → City mappings ──────────────────────────────────────────────────────
-- Ubud-based activity tours
insert into tour_cities (tour_id, city_id) values
  ('e1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'), -- ATV 250cc → Ubud
  ('e1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'), -- UTV 800cc → Ubud
  ('e1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001'), -- Rafting → Ubud
  ('e1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001'), -- Rafting+ATV → Ubud
  ('e1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001'), -- River Tubing → Ubud
  ('e1000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001'), -- ATV+Tubing → Ubud
  ('e1000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001'), -- Jungle Cart → Ubud
  ('e1000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001'), -- Zipline → Ubud
  ('e1000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001'), -- Sky Bike → Ubud
  ('e1000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001'), -- Electric Cycling → Ubud

-- Mt Batur tours → East Bali
  ('e1000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000007'), -- Batur Jeep → East Bali
  ('e1000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000007'), -- Batur Trekking → East Bali

-- Buggy → Canggu
  ('e1000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003'), -- Buggy → Canggu

-- Dirt Bike → East Bali
  ('e1000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000007'), -- Dirt Bike → East Bali

-- Paragliding → Uluwatu
  ('e1000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000004'), -- Paragliding → Uluwatu & Jimbaran

-- Bungee → Nusa Penida
  ('e1000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000005'), -- Bungee → Nusa Penida

-- Surf → Canggu
  ('e1000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000003'), -- Surf → Canggu

-- Jetski → Sanur
  ('e1000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000006'), -- Jetski → Sanur

-- Snorkeling → East Bali + Sanur
  ('e1000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000007'), -- Snorkeling Blue Lagoon → East Bali
  ('e1000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000006'), -- also visible from Sanur

-- Manta snorkeling → Nusa Penida
  ('e1000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000005'), -- Manta snorkeling → Nusa Penida

-- Dolphin → North Bali
  ('e1000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000009'), -- Dolphin → North Bali

-- Horse riding
  ('e1000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000002'), -- Horse Seminyak → Seminyak
  ('e1000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000007'), -- Horse Candidasa → East Bali

-- Camel → Uluwatu
  ('e1000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000004'), -- Camel → Uluwatu & Jimbaran

-- Nusa Penida tours
  ('e1000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000005'), -- West NP → Nusa Penida
  ('e1000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000005'), -- East NP → Nusa Penida
  ('e1000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000005'), -- Mix NP → Nusa Penida

-- Ubud cultural tours
  ('e1000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000001'), -- Ubud Art → Ubud
  ('e1000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000001'), -- Ubud+Batur → Ubud
  ('e1000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000007'), -- also East Bali

-- Uluwatu tour
  ('e1000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000004'), -- Beach+Uluwatu → Uluwatu & Jimbaran

-- Lempuyang → East Bali
  ('e1000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000007'), -- Lempuyang → East Bali

-- North Bali waterfalls
  ('e1000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000009'), -- Banyumala → North Bali
  ('e1000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000009'), -- Sekumpul → North Bali
  ('e1000000-0000-0000-0000-000000000034', 'b0000000-0000-0000-0000-000000000009'), -- Hidden Waterfall → North Bali

-- Mother Temple → East Bali + Ubud
  ('e1000000-0000-0000-0000-000000000035', 'b0000000-0000-0000-0000-000000000007'), -- Besakih → East Bali
  ('e1000000-0000-0000-0000-000000000035', 'b0000000-0000-0000-0000-000000000001'), -- also from Ubud

-- Ubud waterfall
  ('e1000000-0000-0000-0000-000000000036', 'b0000000-0000-0000-0000-000000000001'), -- Ubud+Waterfall → Ubud

-- Ubud VW Safari
  ('e1000000-0000-0000-0000-000000000037', 'b0000000-0000-0000-0000-000000000001'), -- VW Safari → Ubud

-- Custom → all areas
  ('e1000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000001'), -- Custom → Ubud
  ('e1000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000002'), -- Custom → Seminyak
  ('e1000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000003'), -- Custom → Canggu
  ('e1000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000004'), -- Custom → Uluwatu & Jimbaran
  ('e1000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000005'), -- Custom → Nusa Penida
  ('e1000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000006'), -- Custom → Sanur
  ('e1000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000007'), -- Custom → East Bali
  ('e1000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000009'); -- Custom → North Bali
