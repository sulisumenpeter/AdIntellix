CREATE TABLE IF NOT EXISTS public.creative_briefs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  concept text,
  hook text,
  offer text,
  cta text,
  messaging_theme text,
  format text,
  target_audience text,
  destination_intent text,
  overall_score integer,
  hook_score integer,
  offer_score integer,
  cta_score integer,
  messaging_theme_score integer,
  format_score integer,
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  evidence jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'scoring', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's creative briefs" ON public.creative_briefs
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert creative briefs in their organization" ON public.creative_briefs
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update creative briefs in their organization" ON public.creative_briefs
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.ad_fatigue_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  advertisement_id uuid NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  fatigue_score integer NOT NULL,
  fatigue_status text NOT NULL CHECK (fatigue_status IN ('healthy', 'warning', 'fatigued')),
  signals_detected jsonb DEFAULT '[]'::jsonb,
  first_observed_date date NOT NULL,
  latest_observed_date date NOT NULL,
  recommendation text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(advertisement_id)
);

ALTER TABLE public.ad_fatigue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's ad fatigue reports" ON public.ad_fatigue_reports
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert ad fatigue reports in their organization" ON public.ad_fatigue_reports
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update ad fatigue reports in their organization" ON public.ad_fatigue_reports
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_creative_briefs_updated_at
  BEFORE UPDATE ON public.creative_briefs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
