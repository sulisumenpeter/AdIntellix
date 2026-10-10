-- Remove global credentials from connection table since they are now in environment variables
ALTER TABLE public.google_ads_connections
DROP COLUMN IF EXISTS client_id,
DROP COLUMN IF EXISTS client_secret,
DROP COLUMN IF EXISTS developer_token;
