import { GoogleAdsApi } from 'google-ads-api';
import { env } from '../env';

export interface SearchTermData {
  search_term: string;
  campaign: string;
  ad_group: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversion_value: number;
  date: string;
}

export class GoogleAdsProvider {
  private client: GoogleAdsApi;
  private refreshToken: string;

  constructor(refreshToken: string) {
    if (!env.GOOGLE_ADS_CLIENT_ID || !env.GOOGLE_ADS_CLIENT_SECRET || !env.GOOGLE_ADS_DEVELOPER_TOKEN) {
      throw new Error('Google Ads API credentials are not fully configured in the environment.');
    }

    this.refreshToken = refreshToken;
    this.client = new GoogleAdsApi({
      client_id: env.GOOGLE_ADS_CLIENT_ID,
      client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN
    });
  }

  async getSearchTerms(customerId: string): Promise<SearchTermData[]> {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const customer = this.client.Customer({
      customer_id: customerId.replace(/-/g, ''), // Ensure no dashes
      refresh_token: this.refreshToken
    });

    // We use standard search_term_view to gather the data. Keep it READ-ONLY.
    const query = `
      SELECT 
        search_term_view.search_term, 
        campaign.name, 
        ad_group.name, 
        metrics.impressions, 
        metrics.clicks, 
        metrics.cost_micros, 
        metrics.conversions, 
        metrics.conversions_value, 
        segments.date
      FROM search_term_view 
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
      LIMIT 100
    `;

    try {
      const rows = await customer.query(query);

      return rows.map((row: Record<string, unknown> | unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as Record<string, any>;
        return {
        search_term: r.search_term_view?.search_term || 'unknown',
        campaign: r.campaign?.name || 'unknown',
        ad_group: r.ad_group?.name || 'unknown',
        impressions: r.metrics?.impressions || 0,
        clicks: r.metrics?.clicks || 0,
        cost: (r.metrics?.cost_micros || 0) / 1000000,
        conversions: r.metrics?.conversions || 0,
        conversion_value: r.metrics?.conversions_value || 0,
        date: r.segments?.date || new Date().toISOString()
      };
    });
    } catch (e: unknown) {
      const err = e as Error;
      console.error('[GoogleAdsProvider] Failed to fetch search terms', err);
      throw new Error(`Google Ads API error: ${err.message}`);
    }
  }
}
