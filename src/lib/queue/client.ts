import { Queue, Worker, QueueEvents } from 'bullmq';
import { env } from '../env';
import IORedis from 'ioredis';

const redisUrl = env.REDIS_URL || 'redis://localhost:6379';
const parsedUrl = new URL(redisUrl);
const isTls = redisUrl.startsWith('rediss://');

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  ...(isTls && { tls: { servername: parsedUrl.hostname } })
});

export const QUEUE_NAMES = {
  AD_INGESTION: 'ad-ingestion',
  AI_BATCH_ANALYSIS: 'ai-batch-analysis',
  WEB_CRAWLING: 'web-crawling',
  APIFY_INGESTION: 'apify-ingestion',
  AD_ANALYSIS: 'ad-analysis',
  CREATIVE_BRIEF_SCORING: 'creative-brief-scoring',
  AD_FATIGUE: 'ad-fatigue',
  LANDING_PAGE_MATCH: 'landing-page-match',
  GOOGLE_ADS_IMPORT: 'google-ads-import',
  ICP_LEAD_IMPORT: 'icp-lead-import',
  ICP_LEAD_SCORING: 'icp-lead-scoring',
  ICP_REPORT_GENERATION: 'icp-report-generation'
};

export function createQueue(name: string) {
  return new Queue(name, { 
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 1000
    }
  });
}
