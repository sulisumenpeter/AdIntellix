import { AdProvider } from '../providers/ad-provider.interface';
import { metaProvider } from '../providers/meta-provider';
import { googleProvider } from '../providers/google-provider';
import { processCompetitorAd } from './competitor-ad';
import { logger } from '../observability/logger';

export class IngestionManager {
  private providers: Map<string, AdProvider> = new Map();

  constructor() {
    this.providers.set(metaProvider.name, metaProvider);
    this.providers.set(googleProvider.name, googleProvider);
  }

  async runIngestionJob(providerName: 'meta' | 'google', query: string, organizationId: string, projectId: string) {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Unsupported provider: ${providerName}`);
    }

    const hasAccess = await provider.verifyAccess(organizationId);
    if (!hasAccess) {
      throw new Error(`Provider access verification failed for ${providerName}`);
    }

    logger.info(`Starting ingestion for ${providerName} - Query: ${query}`);
    
    const ads = await provider.fetchAds(query, {
      organizationId,
      projectId,
      limit: 100
    });

    let successCount = 0;
    let failCount = 0;

    for (const adPayload of ads) {
      try {
        await processCompetitorAd(adPayload);
        successCount++;
      } catch (error) {
        failCount++;
        logger.error(error as Error, { externalId: adPayload.externalId });
      }
    }

    logger.info(`Ingestion complete for ${providerName}. Success: ${successCount}, Failed: ${failCount}`);
    
    return { successCount, failCount };
  }
}

export const ingestionManager = new IngestionManager();
