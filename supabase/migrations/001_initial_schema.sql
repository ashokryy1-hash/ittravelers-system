-- Enable UUID extension
create extension if not exists "uuid-ossp";

create table destinations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  country text not null,
  cover_image_url text,
  vibe_description text,
  mood_tags jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table cities (
  id uuid primary key default uuid_generate_v4(),
  destination_id uuid references destinations(id) on delete cascade,
  name text not null,
  vibe_tagline text,
  has_hotels boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table explorer_hotels (
  id uuid primary key default uuid_generate_v4(),
  city_id uuid references cities(id) on delete cascade,
  name text not null,
  star_rating integer check (star_rating between 1 and 5),
  chain text,
  room_types jsonb default '[]'::jsonb,
  photo_link_url text,
  tiktok_url text,
  notes text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table explorer_tours (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  category text check (category in ('Romantic','Adventure','Cultural','Nature','Water')),
  tour_link_url text,
  tiktok_url text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table tour_cities (
  tour_id uuid references explorer_tours(id) on delete cascade,
  city_id uuid references cities(id) on delete cascade,
  primary key (tour_id, city_id)
);

-- RLS policies (allow all for now — admin handles auth via password in app)
alter table destinations enable row level security;
alter table cities enable row level security;
alter table explorer_hotels enable row level security;
alter table explorer_tours enable row level security;
alter table tour_cities enable row level security;

create policy "Allow public read" on destinations for select using (true);
create policy "Allow public read" on cities for select using (true);
create policy "Allow public read" on explorer_hotels for select using (true);
create policy "Allow public read" on explorer_tours for select using (true);
create policy "Allow public read" on tour_cities for select using (true);
create policy "Allow all" on destinations for all using (true);
create policy "Allow all" on cities for all using (true);
create policy "Allow all" on explorer_hotels for all using (true);
create policy "Allow all" on explorer_tours for all using (true);
create policy "Allow all" on tour_cities for all using (true);
