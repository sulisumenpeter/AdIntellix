-- Create table for Google Ads connections
CREATE TABLE IF NOT EXISTS public.google_ads_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    developer_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for google_ads_connections
ALTER TABLE public.google_ads_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connections for their organizations"
    ON public.google_ads_connections
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert connections for their organizations"
    ON public.google_ads_connections
    FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update connections for their organizations"
    ON public.google_ads_connections
    FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete connections for their organizations"
    ON public.google_ads_connections
    FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

-- Create table for Google Ads search terms
CREATE TABLE IF NOT EXISTS public.google_ads_search_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES public.google_ads_connections(id) ON DELETE CASCADE,
    search_term TEXT NOT NULL,
    campaign TEXT,
    ad_group TEXT,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    conversions DECIMAL(10,2) DEFAULT 0,
    conversion_value DECIMAL(10,2) DEFAULT 0,
    date DATE,
    classification TEXT,
    relevance_score INTEGER,
    waste_indicator BOOLEAN DEFAULT false,
    explanation TEXT,
    suggested_negative_keyword TEXT,
    raw_metadata JSONB DEFAULT '{}'::jsonb,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for google_ads_search_terms
ALTER TABLE public.google_ads_search_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view search terms for their organizations"
    ON public.google_ads_search_terms
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert search terms for their organizations"
    ON public.google_ads_search_terms
    FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update search terms for their organizations"
    ON public.google_ads_search_terms
    FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete search terms for their organizations"
    ON public.google_ads_search_terms
    FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));
