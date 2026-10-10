CREATE TABLE public.ad_to_landing_page_matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  advertisement_id uuid references public.advertisements(id) on delete cascade not null,
  destination_url text not null,
  overall_score integer not null,
  hook_alignment integer not null,
  offer_alignment integer not null,
  cta_alignment integer not null,
  messaging_alignment integer not null,
  mismatches jsonb not null default '[]'::jsonb,
  supporting_evidence text not null,
  recommendations jsonb not null default '[]'::jsonb,
  crawled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.ad_to_landing_page_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view landing page matches in their orgs"
ON public.ad_to_landing_page_matches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = ad_to_landing_page_matches.organization_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create landing page matches in their orgs"
ON public.ad_to_landing_page_matches FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = ad_to_landing_page_matches.organization_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update landing page matches in their orgs"
ON public.ad_to_landing_page_matches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = ad_to_landing_page_matches.organization_id
    AND om.user_id = auth.uid()
  )
);
