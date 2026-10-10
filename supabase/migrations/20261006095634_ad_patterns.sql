CREATE OR REPLACE FUNCTION get_ad_patterns(p_project_id uuid, p_org_id uuid)
RETURNS TABLE (
  pattern_type text,
  pattern_value text,
  occurrence_count bigint,
  first_observed timestamptz,
  last_observed timestamptz
) AS $$
BEGIN
  RETURN QUERY
  -- Hooks
  SELECT 
    'hook'::text as pattern_type,
    aa.hook as pattern_value,
    count(a.id) as occurrence_count,
    min(COALESCE(a.start_date::timestamptz, a.created_at)) as first_observed,
    max(COALESCE(a.end_date::timestamptz, a.created_at)) as last_observed
  FROM advertisements a
  JOIN advertisement_analyses aa ON a.id = aa.advertisement_id
  WHERE a.project_id = p_project_id AND a.organization_id = p_org_id
    AND aa.hook IS NOT NULL
  GROUP BY aa.hook
  
  UNION ALL
  
  -- Offers
  SELECT 
    'offer'::text as pattern_type,
    aa.offer as pattern_value,
    count(a.id) as occurrence_count,
    min(COALESCE(a.start_date::timestamptz, a.created_at)) as first_observed,
    max(COALESCE(a.end_date::timestamptz, a.created_at)) as last_observed
  FROM advertisements a
  JOIN advertisement_analyses aa ON a.id = aa.advertisement_id
  WHERE a.project_id = p_project_id AND a.organization_id = p_org_id
    AND aa.offer IS NOT NULL
  GROUP BY aa.offer
  
  UNION ALL
  
  -- CTAs
  SELECT 
    'cta'::text as pattern_type,
    aa.cta as pattern_value,
    count(a.id) as occurrence_count,
    min(COALESCE(a.start_date::timestamptz, a.created_at)) as first_observed,
    max(COALESCE(a.end_date::timestamptz, a.created_at)) as last_observed
  FROM advertisements a
  JOIN advertisement_analyses aa ON a.id = aa.advertisement_id
  WHERE a.project_id = p_project_id AND a.organization_id = p_org_id
    AND aa.cta IS NOT NULL
  GROUP BY aa.cta
  
  UNION ALL
  
  -- Messaging Themes
  SELECT 
    'messaging_theme'::text as pattern_type,
    aa.messaging_theme as pattern_value,
    count(a.id) as occurrence_count,
    min(COALESCE(a.start_date::timestamptz, a.created_at)) as first_observed,
    max(COALESCE(a.end_date::timestamptz, a.created_at)) as last_observed
  FROM advertisements a
  JOIN advertisement_analyses aa ON a.id = aa.advertisement_id
  WHERE a.project_id = p_project_id AND a.organization_id = p_org_id
    AND aa.messaging_theme IS NOT NULL
  GROUP BY aa.messaging_theme
  
  ORDER BY occurrence_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
