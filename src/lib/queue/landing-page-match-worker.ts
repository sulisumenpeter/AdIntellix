import { Worker, Job } from 'bullmq';
import { z } from 'zod';
import { redisConnection, QUEUE_NAMES } from './client';
import { logger } from '../observability/logger';
import { processLandingPageMatch, LandingPageMatchInput } from '../intelligence/landing-page-matcher';

export const LandingPageMatchJobSchema = z.object({
  organizationId: z.string().uuid(),
  advertisementId: z.string().uuid()
});

export const landingPageMatchWorker = new Worker(QUEUE_NAMES.LANDING_PAGE_MATCH, async (job: Job) => {
  const parseResult = LandingPageMatchJobSchema.safeParse(job.data);
  if (!parseResult.success) throw new Error('Invalid job payload');
  const data = parseResult.data as LandingPageMatchInput;
  logger.info(`Starting landing page match analysis for ad: ${data.advertisementId}`);

  try {
    const result = await processLandingPageMatch(data);
    return { status: 'success', data: result.data };
  } catch (error: unknown) {
    logger.error('Landing page match analysis failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}, { 
  connection: redisConnection,
  concurrency: 5
});

landingPageMatchWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Landing page match job ${job.id} failed`, { error: err.message });
  }
});
