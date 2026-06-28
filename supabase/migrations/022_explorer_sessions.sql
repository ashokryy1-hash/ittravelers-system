-- Explorer client sessions: saves Trip Explorer meeting summaries
create table if not exists explorer_sessions (
  id          uuid primary key default gen_random_uuid(),
  client_name text not null,
  destination text,
  selections  jsonb not null default '[]',
  hotel_dates jsonb not null default '{}',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for searching by client name
create index if not exists explorer_sessions_client_name_idx
  on explorer_sessions (lower(client_name));

-- Auto-update updated_at on row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger explorer_sessions_updated_at
  before update on explorer_sessions
  for each row execute function set_updated_at();
