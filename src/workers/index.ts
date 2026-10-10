import { Worker } from 'bullmq';
import { z } from 'zod';
import { redisConnection, QUEUE_NAMES } from '../lib/queue/client';
import { logger } from '../lib/observability/logger';
import { processLeadScoring } from './icp-lead-scoring.worker';
import { processLeadImport } from './icp-lead-import.worker';
import { processReportGeneration } from './icp-report-generation.worker';

import { adAnalysisWorker } from '../lib/queue/ad-analysis-worker';
import { adFatigueWorker } from '../lib/queue/ad-fatigue-worker';
import { apifyWorker } from '../lib/queue/apify-worker';
import { crawlWorker } from '../lib/queue/crawl-worker';
import { creativeBriefWorker } from '../lib/queue/creative-brief-worker';
import { googleAdsWorker } from '../lib/queue/google-ads-worker';
import { landingPageMatchWorker } from '../lib/queue/landing-page-match-worker';
import { observationWorker } from '../lib/queue/observation-worker';

console.log('Starting background workers...');

const AIBatchJobSchema = z.object({ id: z.string() });
const aiAnalysisWorker = new Worker(QUEUE_NAMES.AI_BATCH_ANALYSIS, async job => {
  const parseResult = AIBatchJobSchema.safeParse(job.data);
  if (!parseResult.success) throw new Error('Invalid job payload');
  logger.info(`Processing AI batch analysis job: ${job.id}`);
  // Implement AI batch analysis via AI Gateway
}, { connection: redisConnection });

const leadImportWorker = new Worker(QUEUE_NAMES.ICP_LEAD_IMPORT, async job => {
  logger.info(`Processing lead import job: ${job.id}`);
  await processLeadImport(job.id || '', job.data);
}, { connection: redisConnection });

const leadScoringWorker = new Worker(QUEUE_NAMES.ICP_LEAD_SCORING, async job => {
  logger.info(`Processing lead scoring job: ${job.id}`);
  await processLeadScoring(job.id || '', job.data);
}, { connection: redisConnection });

const reportGenWorker = new Worker(QUEUE_NAMES.ICP_REPORT_GENERATION, async job => {
  logger.info(`Processing report generation job: ${job.id}`);
  await processReportGeneration(job.id || '', job.data);
}, { connection: redisConnection });

aiAnalysisWorker.on('completed', job => logger.info(`AI analysis job ${job.id} completed.`));
aiAnalysisWorker.on('failed', (job, err) => logger.error(err, { jobId: job?.id }));

leadImportWorker.on('completed', job => logger.info(`Lead import job ${job.id} completed.`));
leadImportWorker.on('failed', (job, err) => logger.error(err, { jobId: job?.id }));

leadScoringWorker.on('completed', job => logger.info(`Lead scoring job ${job.id} completed.`));
leadScoringWorker.on('failed', (job, err) => logger.error(err, { jobId: job?.id }));

reportGenWorker.on('completed', job => logger.info(`Report generation job ${job.id} completed.`));
reportGenWorker.on('failed', (job, err) => logger.error(err, { jobId: job?.id }));

export const workers = [
  aiAnalysisWorker,
  leadImportWorker,
  leadScoringWorker,
  reportGenWorker,
  adAnalysisWorker,
  adFatigueWorker,
  apifyWorker,
  crawlWorker,
  creativeBriefWorker,
  googleAdsWorker,
  landingPageMatchWorker,
  observationWorker
];

let isShuttingDown = false;

export async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}, initiating graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000); // 30 seconds grace period

  try {
    logger.info('Stopping workers from accepting new jobs...');
    // Close workers (stops taking new jobs and waits for active ones)
    await Promise.all(workers.map(worker => worker.close()));

    logger.info('Closing Redis connection...');
    if (redisConnection) {
      redisConnection.disconnect();
    }

    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
}

// Only run on when not in test
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
