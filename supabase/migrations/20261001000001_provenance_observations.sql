-- Migration: Data Provenance & Historical Observations Constraints
-- Ensures idempotency and deduplication

-- 1. Enforce idempotent historical observations (one observation per ad per day)
ALTER TABLE public.advertisement_observations
ADD CONSTRAINT ad_obs_unique_date UNIQUE (advertisement_id, observation_date);

-- 2. Enforce idempotent provenance logging (deduplicate by content hash within tenant)
ALTER TABLE public.data_provenance_logs
ADD CONSTRAINT prov_hash_unique UNIQUE (organization_id, content_hash);

-- 3. Add creative tracking to advertisements to detect creative changes
ALTER TABLE public.advertisements
ADD COLUMN creative_hash text;

-- 4. Enable RLS on newly created policies if missing (foundation had the tables but let's be sure RLS works for these operations)
CREATE POLICY "Users can manage ad observations in their orgs"
ON public.advertisement_observations FOR ALL
USING (exists (
  select 1 from public.advertisements a
  join public.organization_members om on a.organization_id = om.organization_id
  where a.id = public.advertisement_observations.advertisement_id
  and om.user_id = auth.uid()
));

CREATE POLICY "Users can manage provenance in their orgs"
ON public.data_provenance_logs FOR ALL
USING (exists (
  select 1 from public.organization_members
  where organization_id = public.data_provenance_logs.organization_id
  and user_id = auth.uid()
));
