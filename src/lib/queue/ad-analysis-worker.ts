import { Worker, Job } from 'bullmq';
import { z } from 'zod';
import { redisConnection, QUEUE_NAMES } from './client';
import { analyzeAdvertisement } from '../intelligence/ad-analyzer';
import { logger } from '../observability/logger';
import { createAdminClient } from '../supabase/admin';

export const AdAnalysisJobSchema = z.object({
  organizationId: z.string().uuid(),
  advertisementId: z.string().uuid()
});
export type AdAnalysisJobData = z.infer<typeof AdAnalysisJobSchema>;

export const adAnalysisWorker = new Worker(QUEUE_NAMES.AD_ANALYSIS, async (job: Job) => {
  const parseResult = AdAnalysisJobSchema.safeParse(job.data);
  if (!parseResult.success) {
    logger.warn(`Malformed ad analysis job payload: ${job.id}`);
    throw new Error('Invalid job payload');
  }
  const data = parseResult.data;
  
  logger.info(`Starting ad analysis job: ${job.id}`, { 
    organizationId: data.organizationId, 
    advertisementId: data.advertisementId 
  }); // Don't log full data object if it contains secrets

  const supabase = createAdminClient();
  const { data: ad, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('id', data.advertisementId)
    .eq('organization_id', data.organizationId)
    .single();

  if (error || !ad) {
    throw new Error('Advertisement not found or unauthorized');
  }

  // Deduplicate: check if analysis already exists
  const { data: existingAnalysis } = await supabase
    .from('advertisement_analyses')
    .select('id')
    .eq('advertisement_id', ad.id)
    .single();

  if (existingAnalysis) {
    logger.info(`Ad analysis already exists for ad ${ad.id}, skipping.`);
    return { status: 'skipped', reason: 'already_analyzed' };
  }

  try {
    const analysisResult = await analyzeAdvertisement(
      ad.id,
      ad.ad_text,
      ad.headline,
      ad.cta_text,
      data.organizationId
    );

    return {
      status: 'success',
      data: analysisResult.data
    };
  } catch (err: unknown) {
    logger.error('Failed to analyze advertisement', { error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}, {
  connection: redisConnection,
  concurrency: 5,
  limiter: {
    max: 20,
    duration: 1000
  },
  lockDuration: 60000 // 60s
});

adAnalysisWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Ad analysis job ${job.id} failed`, { error: err.message });
  }
});
