CREATE TABLE public.advertisement_analyses (
  id uuid primary key default gen_random_uuid(),
  advertisement_id uuid references public.advertisements(id) on delete cascade not null,
  hook text,
  offer text,
  cta text,
  messaging_theme text,
  raw_analysis jsonb,
  created_at timestamptz default now() not null
);

ALTER TABLE public.advertisement_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analyses in their orgs"
ON public.advertisement_analyses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.advertisements a
    JOIN public.organization_members om ON a.organization_id = om.organization_id
    WHERE a.id = public.advertisement_analyses.advertisement_id
    AND om.user_id = auth.uid()
  )
);
