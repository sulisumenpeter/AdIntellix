-- ICP Profiles
CREATE TABLE IF NOT EXISTS public.icp_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    company_size TEXT,
    revenue_range TEXT,
    geography TEXT,
    job_titles TEXT[],
    technologies TEXT[],
    business_model TEXT,
    other_criteria TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for icp_profiles
ALTER TABLE public.icp_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view ICPs for their organizations" ON public.icp_profiles FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert ICPs for their organizations" ON public.icp_profiles FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update ICPs for their organizations" ON public.icp_profiles FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete ICPs for their organizations" ON public.icp_profiles FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- ICP Rules
CREATE TABLE IF NOT EXISTS public.icp_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icp_profile_id UUID NOT NULL REFERENCES public.icp_profiles(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL,
    operator TEXT NOT NULL,
    value TEXT NOT NULL,
    weight INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.icp_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view ICP rules for their organizations" ON public.icp_rules FOR SELECT USING (icp_profile_id IN (SELECT id FROM public.icp_profiles WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert ICP rules for their organizations" ON public.icp_rules FOR INSERT WITH CHECK (icp_profile_id IN (SELECT id FROM public.icp_profiles WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can update ICP rules for their organizations" ON public.icp_rules FOR UPDATE USING (icp_profile_id IN (SELECT id FROM public.icp_profiles WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can delete ICP rules for their organizations" ON public.icp_rules FOR DELETE USING (icp_profile_id IN (SELECT id FROM public.icp_profiles WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    icp_profile_id UUID REFERENCES public.icp_profiles(id) ON DELETE SET NULL,
    name TEXT,
    email TEXT,
    company TEXT,
    job_title TEXT,
    industry TEXT,
    company_size TEXT,
    revenue TEXT,
    geography TEXT,
    technology TEXT,
    source TEXT,
    raw_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view leads for their organizations" ON public.leads FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert leads for their organizations" ON public.leads FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update leads for their organizations" ON public.leads FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete leads for their organizations" ON public.leads FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- Lead Scores
CREATE TABLE IF NOT EXISTS public.lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    icp_profile_id UUID NOT NULL REFERENCES public.icp_profiles(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL DEFAULT 0,
    qualification_status TEXT NOT NULL,
    matched_criteria JSONB DEFAULT '[]'::jsonb,
    failed_criteria JSONB DEFAULT '[]'::jsonb,
    score_breakdown JSONB DEFAULT '{}'::jsonb,
    scored_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view lead scores for their organizations" ON public.lead_scores FOR SELECT USING (lead_id IN (SELECT id FROM public.leads WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert lead scores for their organizations" ON public.lead_scores FOR INSERT WITH CHECK (lead_id IN (SELECT id FROM public.leads WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can update lead scores for their organizations" ON public.lead_scores FOR UPDATE USING (lead_id IN (SELECT id FROM public.leads WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can delete lead scores for their organizations" ON public.lead_scores FOR DELETE USING (lead_id IN (SELECT id FROM public.leads WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));

-- Report Runs
CREATE TABLE IF NOT EXISTS public.report_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    data JSONB DEFAULT '{}'::jsonb,
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view report runs for their organizations" ON public.report_runs FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert report runs for their organizations" ON public.report_runs FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update report runs for their organizations" ON public.report_runs FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete report runs for their organizations" ON public.report_runs FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
