import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

vi.mock('bullmq', () => ({
  Worker: class {
    constructor(queueName: string, processFn: unknown) {
      (this as {processFn?: unknown}).processFn = processFn;
    }
    on() {}
    close() { return Promise.resolve(); }
  },
  Queue: class {
    add = vi.fn().mockResolvedValue({});
    close = vi.fn().mockResolvedValue(undefined);
  },
  QueueEvents: class {
    on() {}
    close() { return Promise.resolve(); }
  }
}));

import { googleAdsWorker } from '../../src/lib/queue/google-ads-worker';

const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock('../../src/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'google_ads_connections') {
        return {
          select: mockSelect.mockReturnThis(),
          eq: mockEq.mockReturnThis(),
          single: mockSingle
        };
      }
      if (table === 'projects') {
        return {
          select: mockSelect.mockReturnThis(),
          eq: mockEq.mockReturnThis(),
          single: mockSingle
        };
      }
      if (table === 'google_ads_search_terms') {
        return {
          insert: mockInsert.mockReturnThis()
        };
      }
      return {};
    }
  })
}));

vi.mock('../../src/lib/intelligence/search-term-classifier', () => ({
  classifySearchTerm: vi.fn().mockResolvedValue({
    classification: 'competitor',
    relevance_score: 10,
    waste_indicator: true,
    explanation: 'Searching for a competitor platform',
    suggested_negative_keyword: 'shopify'
  })
}));

vi.mock('../../src/lib/encryption', () => ({
  decrypt: vi.fn().mockReturnValue('decrypted-token')
}));

vi.mock('../../src/lib/providers/google-ads-provider', () => ({
  GoogleAdsProvider: class {
    getSearchTerms() {
      return Promise.resolve([
        { search_term: 'test term 1', campaign: 'camp1', ad_group: 'ag1', impressions: 10, clicks: 1, cost: 1.5, conversions: 0, conversion_value: 0, date: '2026-10-01' },
        { search_term: 'test term 2', campaign: 'camp1', ad_group: 'ag1', impressions: 20, clicks: 2, cost: 3.0, conversions: 1, conversion_value: 10, date: '2026-10-01' }
      ]);
    }
  }
}));

describe('Google Ads Worker Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await googleAdsWorker.close();
  });

  it('should import and classify search terms successfully', async () => {
    const jobData = {
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      connectionId: '550e8400-e29b-41d4-a716-446655440005'
    };

    // Mock connection
    mockSingle.mockResolvedValueOnce({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440005',
        client_id: 'client-id',
        client_secret: 'client-secret',
        developer_token: 'dev-token',
        refresh_token: 'refresh-token',
        customer_id: '123-456'
      },
      error: null
    });

    // Mock project
    mockSingle.mockResolvedValueOnce({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        description: 'E-commerce platform'
      },
      error: null
    });

    mockInsert.mockResolvedValue({ error: null });

    const worker = googleAdsWorker as unknown as { processFn: (job: { id: string, data: typeof jobData }) => Promise<{status: string, importedCount: number}> };
    const result = await worker.processFn({ id: '550e8400-e29b-41d4-a716-446655440006', data: jobData });
    
    expect(result.status).toBe('success');
    expect(result.importedCount).toBe(2);
    // Since mock provider returns 2 search terms
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });
});
