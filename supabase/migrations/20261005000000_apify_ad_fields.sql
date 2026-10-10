-- Add Apify ingestion fields to advertisements
alter table public.advertisements
  add column if not exists page_id text,
  add column if not exists ad_text text,
  add column if not exists headline text,
  add column if not exists cta_text text,
  add column if not exists media_urls text[],
  add column if not exists destination_url text,
  add column if not exists start_date timestamptz,
  add column if not exists end_date timestamptz,
  add column if not exists is_active boolean,
  add column if not exists source_url text,
  add column if not exists creative_hash text,
  add column if not exists raw_source_metadata jsonb;
