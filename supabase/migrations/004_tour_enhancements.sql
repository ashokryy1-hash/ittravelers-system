-- Tour enhancements: cover photo, 4 TikTok links, inclusions, exclusions, new categories

alter table explorer_tours add column if not exists cover_image_url text;
alter table explorer_tours add column if not exists tiktok_1 text;
alter table explorer_tours add column if not exists tiktok_2 text;
alter table explorer_tours add column if not exists tiktok_3 text;
alter table explorer_tours add column if not exists tiktok_4 text;
alter table explorer_tours add column if not exists inclusions jsonb default '[]'::jsonb;
alter table explorer_tours add column if not exists exclusions jsonb default '[]'::jsonb;

-- Update category constraint to include new categories
alter table explorer_tours drop constraint if exists explorer_tours_category_check;
alter table explorer_tours add constraint explorer_tours_category_check
  check (category in ('Romantic','Adventure','Cultural','Nature','Water','Nightlife','Beach Club'));
