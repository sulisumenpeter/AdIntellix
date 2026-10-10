import { Worker, Job } from 'bullmq';
import { z } from 'zod';
import { QUEUE_NAMES, redisConnection } from './client';
import { createAdminClient } from '../supabase/admin';
import { GoogleAdsProvider } from '../providers/google-ads-provider';
import { classifySearchTerm } from '../intelligence/search-term-classifier';
import { decrypt } from '../encryption';

export const GoogleAdsImportJobSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  connectionId: z.string().uuid()
});
export type GoogleAdsImportJobData = z.infer<typeof GoogleAdsImportJobSchema>;

export const googleAdsWorker = new Worker(
  QUEUE_NAMES.GOOGLE_ADS_IMPORT,
  async (job: Job) => {
    const parseResult = GoogleAdsImportJobSchema.safeParse(job.data);
    if (!parseResult.success) throw new Error('Invalid job payload');
    const { organizationId, projectId, connectionId } = parseResult.data;
    const supabase = createAdminClient();

    // Verify connection exists and fetch credentials securely
    const { data: connection, error: connError } = await supabase
      .from('google_ads_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('organization_id', organizationId)
      .single();

    if (connError || !connection) {
      throw new Error(`Connection ${connectionId} not found or unauthorized`);
    }

    // Get project context
    const { data: project } = await supabase
      .from('projects')
      .select('description')
      .eq('id', projectId)
      .single();
      
    const projectContext = project?.description || 'A business project';

    // Decrypt the refresh token
    let plainRefreshToken: string;
    try {
      plainRefreshToken = decrypt(connection.refresh_token);
    } catch (e) {
      throw new Error(`Failed to decrypt refresh token for connection ${connectionId}`);
    }

    // Instantiate Google Ads Provider
    const provider = new GoogleAdsProvider(plainRefreshToken);

    // Import Search Terms
    const searchTerms = await provider.getSearchTerms(connection.customer_id);

    // Process and classify each term
    for (const termData of searchTerms) {
      // Classify the search term
      const classification = await classifySearchTerm(termData.search_term, projectContext, organizationId);

      // Persist to database
      const { error: insertError } = await supabase
        .from('google_ads_search_terms')
        .insert({
          organization_id: organizationId,
          project_id: projectId,
          connection_id: connectionId,
          search_term: termData.search_term,
          campaign: termData.campaign,
          ad_group: termData.ad_group,
          impressions: termData.impressions,
          clicks: termData.clicks,
          cost: termData.cost,
          conversions: termData.conversions,
          conversion_value: termData.conversion_value,
          date: termData.date,
          classification: classification.classification,
          relevance_score: classification.relevance_score,
          waste_indicator: classification.waste_indicator,
          explanation: classification.explanation,
          suggested_negative_keyword: classification.suggested_negative_keyword,
          raw_metadata: termData
        });

      if (insertError) {
        console.error(`[GoogleAdsWorker] Failed to insert search term: ${termData.search_term}`, insertError);
      }
    }

    return { status: 'success', importedCount: searchTerms.length };
  },
  {
    connection: redisConnection,
    concurrency: 1
  }
);

googleAdsWorker.on('failed', (job, err) => {
  console.error(`[GoogleAdsWorker] Job ${job?.id} failed with error:`, err);
});
