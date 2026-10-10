import { Worker, Job } from 'bullmq';
import { z } from 'zod';
import { redisConnection, QUEUE_NAMES } from './client';
import { logger } from '../observability/logger';
import { scoreCreativeBrief, CreativeBriefInput } from '../intelligence/creative-brief-scorer';

export const CreativeBriefJobSchema = z.object({
  briefId: z.string().uuid(),
  input: z.any() // Using any for CreativeBriefInput for simplicity right now
});
export type CreativeBriefJobData = z.infer<typeof CreativeBriefJobSchema>;

export const creativeBriefWorker = new Worker(QUEUE_NAMES.CREATIVE_BRIEF_SCORING, async (job: Job) => {
  const parseResult = CreativeBriefJobSchema.safeParse(job.data);
  if (!parseResult.success) throw new Error('Invalid job payload');
  const data = parseResult.data;
  logger.info(`Starting creative brief scoring: ${data.briefId}`);

  try {
    const result = await scoreCreativeBrief(data.briefId, data.input);
    return { status: 'success', data: result.data };
  } catch (error: unknown) {
    logger.error('Creative brief scoring failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}, { 
  connection: redisConnection,
  concurrency: 5
});

creativeBriefWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Creative brief scoring job ${job.id} failed`, { error: err.message });
  }
});
