-- Create pages table for storing markdown content as key-value pairs
create table pages (
  key        text primary key,
  content    text not null,
  categories jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GIN index for fast category lookups
create index pages_categories_idx on pages using gin(categories);

-- Safely append a category to a page without duplicates
create or replace function append_category(page_key text, category text)
returns void as $$
  update pages
  set categories = categories || to_jsonb(category)
  where key = page_key
  and not categories @> to_jsonb(category);
$$ language sql;
