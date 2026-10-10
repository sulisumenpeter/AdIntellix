import { describe, it, expect } from 'vitest';
import { ApifyAdapter } from '../../src/lib/integrations/apify/apify-adapter';

// This test only runs if APIFY_API_TOKEN is present in the environment
describe.runIf(process.env.APIFY_API_TOKEN)('ApifyAdapter Live Integration Tests', () => {
  it('should run facebook ads library actor and return data', async () => {
    // This could take a minute or two to run the real actor
    const adapter = new ApifyAdapter();
    const searchUrl = 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=shopify';
    
    const results = await adapter.runFacebookAdsLibraryActor(searchUrl, 10);
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const first = results[0];
      expect(first.platform).toBe('meta');
      expect(first.source_url).toBeDefined();
    }
  }, 120000); // give it a 2-minute timeout for the live run
});
