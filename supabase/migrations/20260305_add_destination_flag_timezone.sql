-- Add new destination columns populated by REST Countries API during enrichment

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS flag_url text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS driving_side text,
  ADD COLUMN IF NOT EXISTS calling_code text,
  ADD COLUMN IF NOT EXISTS population bigint,
  ADD COLUMN IF NOT EXISTS region text;
