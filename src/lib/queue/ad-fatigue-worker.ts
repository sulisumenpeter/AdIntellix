import { Worker, Job } from 'bullmq';
import { z } from 'zod';
import { redisConnection, QUEUE_NAMES } from './client';
import { logger } from '../observability/logger';
import { processFatigueDetection } from '../intelligence/ad-fatigue-detector';

export const AdFatigueJobSchema = z.object({
  organizationId: z.string().uuid(),
  advertisementId: z.string().uuid()
});
export type AdFatigueJobData = z.infer<typeof AdFatigueJobSchema>;
/*
  organizationId: string;
  advertisementId: string;
}*/

export const adFatigueWorker = new Worker(QUEUE_NAMES.AD_FATIGUE, async (job: Job) => {
  const parseResult = AdFatigueJobSchema.safeParse(job.data);
  if (!parseResult.success) throw new Error('Invalid job payload');
  const data = parseResult.data;
  logger.info(`Starting ad fatigue analysis for ad: ${data.advertisementId}`);

  try {
    const result = await processFatigueDetection(data.organizationId, data.advertisementId);
    return { status: 'success', data: result };
  } catch (error: unknown) {
    logger.error('Ad fatigue analysis failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}, { 
  connection: redisConnection,
  concurrency: 5
});

adFatigueWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Ad fatigue job ${job.id} failed`, { error: err.message });
  }
});
