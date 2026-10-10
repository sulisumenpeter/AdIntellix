import { createAdminClient } from '../supabase/admin';

export interface AdPattern {
  pattern_type: 'hook' | 'offer' | 'cta' | 'messaging_theme';
  pattern_value: string;
  occurrence_count: number;
  first_observed: string;
  last_observed: string;
}

export interface LongRunningAd {
  id: string;
  advertiser_name: string;
  duration_days: number;
  start_date: string;
  end_date: string | null;
  ad_text: string | null;
}

export class PatternDetectorService {
  /**
   * Retrieves deterministic aggregations of recurring hooks, offers, CTAs, and themes.
   */
  static async getPatterns(projectId: string, orgId: string): Promise<AdPattern[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('get_ad_patterns', {
      p_project_id: projectId,
      p_org_id: orgId
    });

    if (error) {
      throw new Error(`Failed to fetch ad patterns: ${error.message}`);
    }

    return (data || []) as AdPattern[];
  }

  /**
   * Retrieves long running ads based on the duration between start date and end date (or current date if active).
   */
  static async getLongRunningAds(projectId: string, orgId: string, minDays = 30): Promise<LongRunningAd[]> {
    const supabase = createAdminClient();
    // Fetch all ads for the project and compute duration in application logic, 
    // or we could use an RPC, but fetching them is fine for reasonable volumes.
    // To be efficient, we do a simple query.
    const { data, error } = await supabase
      .from('advertisements')
      .select('id, advertiser_name, start_date, end_date, ad_text, created_at, is_active')
      .eq('project_id', projectId)
      .eq('organization_id', orgId);

    if (error) {
      throw new Error(`Failed to fetch ads for long-running analysis: ${error.message}`);
    }

    const now = new Date();
    const longRunning: LongRunningAd[] = [];

    for (const ad of (data || [])) {
      const start = ad.start_date ? new Date(ad.start_date) : new Date(ad.created_at);
      let end = now;
      
      if (!ad.is_active && ad.end_date) {
        end = new Date(ad.end_date);
      }

      const durationMs = end.getTime() - start.getTime();
      const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));

      if (durationDays >= minDays) {
        longRunning.push({
          id: ad.id,
          advertiser_name: ad.advertiser_name,
          duration_days: durationDays,
          start_date: start.toISOString(),
          end_date: ad.end_date || null,
          ad_text: ad.ad_text
        });
      }
    }

    return longRunning.sort((a, b) => b.duration_days - a.duration_days);
  }
}
