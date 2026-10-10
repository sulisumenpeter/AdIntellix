import { upsertAdvertisement, recordObservation, Advertisement } from '../models/advertisement';
import { logDataProvenance } from '../provenance/tracker';
import { logger } from '../observability/logger';

export interface RawAdPayload {
  externalId: string;
  platform: 'meta' | 'google';
  advertiser: string;
  isActive: boolean;
  rawJson: string; // The raw API payload from the integration
  projectId: string;
  organizationId: string;
}

export async function processCompetitorAd(payload: RawAdPayload) {
  try {
    // 1. Log Data Provenance FIRST to ensure we never lose historical raw context
    await logDataProvenance({
      organization_id: payload.organizationId,
      source: `${payload.platform}-api`,
      rawContent: payload.rawJson,
      processingStatus: 'raw',
      retentionStatus: 'permanent'
    });

    // 2. Map and Upsert the core Advertisement entity
    const adId = await upsertAdvertisement({
      organization_id: payload.organizationId,
      project_id: payload.projectId,
      external_ad_id: payload.externalId,
      platform: payload.platform,
      advertiser_name: payload.advertiser,
      creative_type: 'image' // Mocked extraction - would normally parse rawJson or use AI Gateway
    });

    // 3. Record the point-in-time Observation (do not overwrite)
    await recordObservation({
      advertisement_id: adId,
      observation_date: new Date().toISOString().split('T')[0],
      status: payload.isActive ? 'active' : 'inactive',
      metrics: { processed: true } 
    });

    logger.info(`Successfully processed competitor ad: ${payload.externalId}`);
  } catch (error: unknown) {
    logger.error(error, { externalId: payload.externalId });
    throw error;
  }
}
