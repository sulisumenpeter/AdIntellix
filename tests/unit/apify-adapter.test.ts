import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApifyAdapter, ApifyAdapterError } from '../../src/lib/integrations/apify/apify-adapter';

// Mock global fetch
const originalFetch = global.fetch;

describe('ApifyAdapter Unit Tests', () => {
  beforeEach(() => {
    process.env.APIFY_API_TOKEN = 'test-token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should initialize successfully with valid token', () => {
    const adapter = new ApifyAdapter();
    expect(adapter).toBeInstanceOf(ApifyAdapter);
  });

  it('should throw if no token is provided', () => {
    delete process.env.APIFY_API_TOKEN;
    expect(() => new ApifyAdapter()).toThrow('APIFY_API_TOKEN is required');
  });

  it('should normalize raw data correctly and extract ID from URL', () => {
    const adapter = new ApifyAdapter();
    const rawData = {
      id: '', // testing extraction
      pageName: 'Test Advertiser',
      pageId: '67890',
      text: 'Buy this now!',
      headlineTitle: 'Huge Sale',
      cta: 'Shop Now',
      mediaUrls: ['https://example.com/img.jpg'],
      link: 'https://example.com/shop',
      startDate: '2023-10-01',
      endDate: '2023-10-31',
      isActive: true,
      adLibraryUrl: 'https://facebook.com/ads/library/?id=12345'
    };

    const normalized = adapter.normalizeData(rawData);

    expect(normalized).toEqual({
      external_ad_id: '12345',
      platform: 'meta',
      advertiser_name: 'Test Advertiser',
      page_id: '67890',
      ad_text: 'Buy this now!',
      headline: 'Huge Sale',
      cta_text: 'Shop Now',
      media_urls: ['https://example.com/img.jpg'],
      destination_url: 'https://example.com/shop',
      start_date: '2023-10-01',
      end_date: '2023-10-31',
      is_active: true,
      source_url: 'https://facebook.com/ads/library/?id=12345',
      creative_hash: null,
      raw_source_metadata: rawData
    });
  });

  it('should retry on 429 rate limit', async () => {
    const adapter = new ApifyAdapter({ maxRetries: 2, timeoutMs: 1000 });
    let attempts = 0;
    
    global.fetch = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts === 1) {
        return Promise.resolve(new Response(null, { 
          status: 429,
          headers: new Headers({ 'Retry-After': '0' })
        }));
      }
      return Promise.resolve(new Response(JSON.stringify({ data: 'success' }), { status: 200 }));
    });

    // We expose a public wrapper around fetchWithRetry for testing, or we just test behavior through a public method.
    // For unit testing, let's cast to any to test the private method directly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (adapter as any).fetchWithRetry('https://api.apify.com/test', {});
    
    expect(attempts).toBe(2);
    expect(res.status).toBe(200);
  });

  it('should not expose credentials in logs on error', async () => {
    const adapter = new ApifyAdapter({ maxRetries: 1, timeoutMs: 1000 });
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    global.fetch = vi.fn().mockImplementation(() => {
      return Promise.reject(new Error('Network failure'));
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((adapter as any).fetchWithRetry('https://api.apify.com/test', {})).rejects.toThrow(ApifyAdapterError);
    
    expect(consoleSpy).toHaveBeenCalled();
    // Verify token is not in any of the console.warn calls
    const logs = consoleSpy.mock.calls.map(call => call.join(' ')).join(' ');
    expect(logs).not.toContain('test-token');
  });
});
