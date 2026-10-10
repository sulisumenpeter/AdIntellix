import { Worker, Job } from 'bullmq';
import { z } from 'zod';
import { redisConnection, QUEUE_NAMES, createQueue } from './client';
import { ApifyAdapter, NormalizedAdData } from '../integrations/apify/apify-adapter';
import { logDataProvenance, logHistoricalObservation } from '../provenance/tracker';
import { upsertAdvertisement, Advertisement } from '../models/advertisement';
import { logger } from '../observability/logger';
import { createAdminClient } from '../supabase/admin';
import crypto from 'crypto';

export const ApifyIngestionJobSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  source: z.string(),
  actorId: z.string(),
  searchUrl: z.string().url().refine(url => url.startsWith('https://www.facebook.com/ads/library'), { message: 'Must be a Facebook Ads Library URL' }),
  resultsLimit: z.number().int().min(1).max(1000)
});

export type ApifyIngestionJobData = z.infer<typeof ApifyIngestionJobSchema>;

export const apifyWorker = new Worker(QUEUE_NAMES.APIFY_INGESTION, async (job: Job) => {
  const parseResult = ApifyIngestionJobSchema.safeParse(job.data);
  if (!parseResult.success) {
    logger.warn(`Malformed apify ingestion job payload: ${job.id}`);
    throw new Error('Invalid job payload');
  }
  const data = parseResult.data;
  
  logger.info(`Starting Apify ingestion job: ${job.id}`, { 
    organizationId: data.organizationId,
    projectId: data.projectId
  });

  // 1 & 2. Validate URL and context
  // Zod already validated URL starts with Facebook Ads Library
  
  const supabase = createAdminClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, organization_id')
    .eq('id', data.projectId)
    .eq('organization_id', data.organizationId)
    .single();
    
  if (error || !project) {
    throw new Error('Unauthorized or invalid project/organization context');
  }

  // 3, 4 & 5. Run Actor and get normalized dataset
  const adapter = new ApifyAdapter();
  let normalizedAds: NormalizedAdData[] = [];
  try {
    normalizedAds = await adapter.runFacebookAdsLibraryActor(data.searchUrl, data.resultsLimit);
  } catch (err: unknown) {
    logger.error('Apify actor execution failed', { error: err instanceof Error ? err.message : 'Unknown error' });
    throw err;
  }

  let inserted = 0;
  let skipped = 0;

  // 6 - 11. Process each result
  for (const adData of normalizedAds) {
    try {
      // Deduplication hash if missing external_ad_id
      const contentToHash = `${adData.advertiser_name}|${adData.ad_text}|${adData.headline}|${adData.destination_url}`;
      const creativeHash = crypto.createHash('sha256').update(contentToHash).digest('hex');
      
      const advertisement: Advertisement = {
        organization_id: data.organizationId,
        project_id: data.projectId,
        external_ad_id: adData.external_ad_id,
        platform: 'meta',
        advertiser_name: adData.advertiser_name,
        creative_type: 'unknown',
        page_id: adData.page_id,
        ad_text: adData.ad_text,
        headline: adData.headline,
        cta_text: adData.cta_text,
        media_urls: adData.media_urls,
        destination_url: adData.destination_url,
        start_date: adData.start_date,
        end_date: adData.end_date,
        is_active: adData.is_active,
        source_url: adData.source_url,
        creative_hash: creativeHash,
        raw_source_metadata: adData.raw_source_metadata,
      };

      // Persist ad (idempotent)
      const adId = await upsertAdvertisement(advertisement);
      
      if (adId) {
        inserted++; // Simplification: we might just count processed vs failed, but let's count success here
      }

      // Record provenance
      await logDataProvenance({
        organization_id: data.organizationId,
        source: 'Apify / automation-lab/facebook-ads-library',
        rawContent: JSON.stringify(adData.raw_source_metadata),
        processingStatus: 'processed',
        retentionStatus: 'permanent'
      });

      // Record historical observation
      const obsDate = new Date().toISOString().split('T')[0];
      await logHistoricalObservation({
        organization_id: data.organizationId,
        advertisement_id: adId,
        observation_date: obsDate,
        status: adData.is_active ? 'active' : 'inactive',
        creativeHash: creativeHash
      });

      // Enqueue AI analysis
      const analysisQueue = createQueue(QUEUE_NAMES.AD_ANALYSIS);
      await analysisQueue.add('analyze-ad', {
        organizationId: data.organizationId,
        advertisementId: adId
      }, {
        jobId: `analyze-${adId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
      });
      await analysisQueue.close();

    } catch (err: unknown) {
      logger.error('Failed to process individual ad', { error: err instanceof Error ? err.message : String(err) });
      skipped++;
    }
  }

  // 12. Return summary
  return {
    status: 'success',
    recordsDiscovered: normalizedAds.length,
    inserted,
    skipped
  };
}, { 
  connection: redisConnection,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000
  },
  lockDuration: 60000 // 60s
});

apifyWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Apify ingestion job ${job.id} failed`, { error: err.message });
  }
});
