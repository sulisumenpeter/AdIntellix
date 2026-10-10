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

import { landingPageMatchWorker } from '../../src/lib/queue/landing-page-match-worker';

const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock('../../src/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'advertisements') {
        return {
          select: mockSelect.mockReturnThis(),
          eq: mockEq.mockReturnThis(),
          single: mockSingle
        };
      }
      if (table === 'ad_to_landing_page_matches') {
        return {
          insert: mockInsert.mockReturnThis(),
          select: mockSelect.mockReturnThis(),
          single: mockSingle
        };
      }
      return {};
    }
  })
}));

vi.mock('../../src/lib/ai/ai-gateway', () => ({
  aiGateway: {
    generate: vi.fn().mockResolvedValue({
      content: {
        overall_score: 85,
        hook_alignment: 90,
        offer_alignment: 80,
        cta_alignment: 100,
        messaging_alignment: 80,
        mismatches: ['Missing explicit warranty'],
        supporting_evidence: 'Matches well',
        recommendations: ['Add warranty info']
      }
    })
  }
}));

vi.mock('../../src/lib/crawling/fetcher', () => ({
  safeFetch: vi.fn().mockResolvedValue({
    url: 'https://example.com/landing',
    content: 'Landing page content with offer and hook',
    headers: {}
  })
}));

describe('Landing Page Match Worker Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await landingPageMatchWorker.close();
  });

  it('should process landing page match successfully', async () => {
    const jobData = {
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      advertisementId: '550e8400-e29b-41d4-a716-446655440002',
      destinationUrl: 'https://example.com/landing'
    };

    // ad single
    mockSingle.mockResolvedValueOnce({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        advertisement_analyses: [{
          hook: 'Buy now',
          offer: '20% off',
          cta: 'Click here',
          messaging_theme: 'Discount'
        }]
      },
      error: null
    });

    // match insert single
    mockSingle.mockResolvedValueOnce({
      data: { id: 'match-1', overall_score: 85 },
      error: null
    });

    const worker = landingPageMatchWorker as unknown as { processFn: (job: { id: string, data: typeof jobData }) => Promise<{status: string, data: Record<string, unknown>}> };
    const result = await worker.processFn({ id: '550e8400-e29b-41d4-a716-446655440006', data: jobData });
    
    expect(result.status).toBe('success');
    expect(result.data.overall_score).toBe(85);
    expect(mockInsert).toHaveBeenCalled();
  });
});
