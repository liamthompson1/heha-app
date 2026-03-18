create table api_keys (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  key_hash    text not null unique,
  prefix      text not null,
  auto_publish boolean not null default true,
  last_used_at timestamptz,
  created_at  timestamptz default now()
);
