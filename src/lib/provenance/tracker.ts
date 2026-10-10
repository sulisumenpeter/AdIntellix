import { createAdminClient } from '../supabase/admin';
import crypto from 'crypto';
import { redisConnection } from '../queue/client';
import { Queue } from 'bullmq';

export interface ProvenanceRecord {
  organization_id: string;
  source: string;
  rawContent: string;
  processingStatus: 'raw' | 'processed' | 'failed';
  retentionStatus: 'temporary' | 'permanent';
}

export interface AdObservation {
  organization_id: string;
  advertisement_id: string;
  observation_date: string; // YYYY-MM-DD
  status: 'active' | 'inactive';
  metrics?: Record<string, unknown>;
  creativeHash?: string;
}

export async function logDataProvenance(record: ProvenanceRecord) {
  const supabase = createAdminClient();
  const contentHash = crypto.createHash('sha256').update(record.rawContent).digest('hex');
  
  // Idempotent upsert via ON CONFLICT (organization_id, content_hash)
  const { error } = await supabase
    .from('data_provenance_logs')
    .upsert({
      organization_id: record.organization_id,
      source: record.source,
      acquisition_timestamp: new Date().toISOString(),
      content_hash: contentHash,
      processing_status: record.processingStatus,
      retention_status: record.retentionStatus
    }, { onConflict: 'organization_id,content_hash' });

  if (error) {
    throw new Error(`Failed to log data provenance: ${error.message}`);
  }

  // Trigger processing if raw
  if (record.processingStatus === 'raw') {
    const queue = new Queue('ad-ingestion', { connection: redisConnection });
    await queue.add('process-provenance', { 
      organization_id: record.organization_id, 
      content_hash: contentHash 
    });
    await queue.close();
  }
}

export async function logHistoricalObservation(observation: AdObservation) {
  const supabase = createAdminClient();

  // 1. Idempotent insertion for observation date
  const { error: obsError } = await supabase
    .from('advertisement_observations')
    .upsert({
      advertisement_id: observation.advertisement_id,
      observation_date: observation.observation_date,
      status: observation.status,
      metrics: observation.metrics || {}
    }, { onConflict: 'advertisement_id,observation_date' });

  if (obsError) {
    throw new Error(`Failed to log historical observation: ${obsError.message}`);
  }

  // 2. Track creative changes
  if (observation.creativeHash) {
    const { data: ad, error: adGetError } = await supabase
      .from('advertisements')
      .select('creative_hash')
      .eq('id', observation.advertisement_id)
      .single();

    if (!adGetError && ad && ad.creative_hash !== observation.creativeHash) {
      // Creative has changed, update hash
      await supabase
        .from('advertisements')
        .update({ creative_hash: observation.creativeHash })
        .eq('id', observation.advertisement_id);
      
      // We could also queue an AI analysis job here for the new creative
      const queue = new Queue('ai-batch-analysis', { connection: redisConnection });
      await queue.add('analyze-creative', {
        advertisement_id: observation.advertisement_id,
        creative_hash: observation.creativeHash
      });
      await queue.close();
    }
  }
}
