export interface IcpProfile {
  id: string;
  organization_id: string;
  project_id: string;
  name: string;
  industry?: string | null;
  company_size?: string | null;
  revenue_range?: string | null;
  geography?: string | null;
  job_titles?: string[] | null;
  technologies?: string[] | null;
  business_model?: string | null;
  other_criteria?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IcpRule {
  id: string;
  icp_profile_id: string;
  rule_type: string;
  operator: string;
  value: string;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  project_id: string;
  icp_profile_id?: string | null;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  job_title?: string | null;
  industry?: string | null;
  company_size?: string | null;
  revenue?: string | null;
  geography?: string | null;
  technology?: string | null;
  source?: string | null;
  raw_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LeadScore {
  id: string;
  lead_id: string;
  icp_profile_id: string;
  overall_score: number;
  qualification_status: string;
  matched_criteria?: Record<string, unknown>[];
  failed_criteria?: Record<string, unknown>[];
  score_breakdown?: Record<string, unknown>;
  scored_at: string;
}

export interface ReportRun {
  id: string;
  organization_id: string;
  project_id: string;
  report_type: string;
  status: string;
  data?: Record<string, unknown>;
  file_url?: string | null;
  created_at: string;
  updated_at: string;
}
