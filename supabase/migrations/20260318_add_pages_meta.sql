ALTER TABLE pages ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;
