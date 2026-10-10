ALTER TABLE public.ai_usage_logs
ADD COLUMN IF NOT EXISTS feature text not null default 'unspecified',
ADD COLUMN IF NOT EXISTS source_content_version text;
