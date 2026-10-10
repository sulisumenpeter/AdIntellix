import { Worker, Job } from 'bullmq';
import { z } from 'zod';
import { redisConnection, QUEUE_NAMES } from './client';
import { safeFetch } from '../crawling/fetcher';
import { logDataProvenance } from '../provenance/tracker';
import { logger } from '../observability/logger';

export const CrawlJobSchema = z.object({
  organization_id: z.string().uuid(),
  url: z.string().url()
});

export const crawlWorker = new Worker(QUEUE_NAMES.WEB_CRAWLING, async (job: Job) => {
  const parseResult = CrawlJobSchema.safeParse(job.data);
  if (!parseResult.success) throw new Error('Invalid job payload');
  const { url, organization_id } = parseResult.data;
  logger.info(`Starting crawl job: ${job.id} for URL: ${url}`);

  try {
    const result = await safeFetch(url);

    await logDataProvenance({
      organization_id,
      source: result.url,
      rawContent: result.content,
      processingStatus: 'raw',
      retentionStatus: 'permanent'
    });

    return { status: 'success', url: result.url };
  } catch (err: unknown) {
    logger.error('Crawl job failed', { url, error: err instanceof Error ? err.message : 'Unknown error' });
    throw err;
  }
}, { 
  connection: redisConnection,
  concurrency: 20,
  lockDuration: 30000 // 30s
});

crawlWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Crawl job ${job.id} failed`, { error: err.message });
  }
});
