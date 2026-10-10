import { createQueue, QUEUE_NAMES } from './client';

const adIngestionQueue = createQueue(QUEUE_NAMES.AD_INGESTION);
const aiAnalysisQueue = createQueue(QUEUE_NAMES.AI_BATCH_ANALYSIS);
const crawlingQueue = createQueue(QUEUE_NAMES.WEB_CRAWLING);
const apifyIngestionQueue = createQueue(QUEUE_NAMES.APIFY_INGESTION);

export async function enqueueAdIngestion(jobData: Record<string, unknown>) {
  return adIngestionQueue.add('ingest-ad', jobData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

export async function enqueueAiAnalysis(jobData: Record<string, unknown>) {
  return aiAnalysisQueue.add('analyze-ad', jobData, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export async function enqueueWebCrawl(jobData: Record<string, unknown>) {
  return crawlingQueue.add('crawl-page', jobData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
  });
}

export async function enqueueApifyIngestion(jobData: Record<string, unknown>) {
  return apifyIngestionQueue.add('apify-ingest', jobData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}
