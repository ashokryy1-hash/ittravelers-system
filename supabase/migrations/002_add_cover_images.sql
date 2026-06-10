-- Add cover_image_url to cities (for area cards on the Bali page)
alter table cities add column if not exists cover_image_url text;

-- Add cover_image_url to explorer_hotels (for hotel card cover photo)
alter table explorer_hotels add column if not exists cover_image_url text;
