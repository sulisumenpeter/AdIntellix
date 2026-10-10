import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { aiGateway } from '../../src/lib/ai/ai-gateway';
import { PatternDetectorService } from '../../src/lib/intelligence/pattern-detector';

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

import { creativeBriefWorker } from '../../src/lib/queue/creative-brief-worker';

vi.mock('../../src/lib/ai/ai-gateway', () => ({
  aiGateway: {
    generate: vi.fn()
  }
}));

vi.mock('../../src/lib/intelligence/pattern-detector', () => ({
  PatternDetectorService: {
    getPatterns: vi.fn().mockResolvedValue([])
  }
}));

const { mockUpdate, mockEq } = vi.hoisted(() => {
  return {
    mockUpdate: vi.fn(),
    mockEq: vi.fn()
  };
});

vi.mock('../../src/lib/supabase/admin', () => {
  const chainable = {
    update: mockUpdate,
    eq: mockEq,
    then: function(resolve: (value: unknown) => void) { resolve({ error: null }); }
  };
  mockUpdate.mockReturnValue(chainable);
  mockEq.mockReturnValue(chainable);
  
  return {
    createAdminClient: () => ({
      from: () => chainable
    })
  };
});

describe('Creative Brief Worker Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await creativeBriefWorker.close();
  });

  it('should score a brief successfully and update db', async () => {
    const jobData = {
      briefId: '550e8400-e29b-41d4-a716-446655440004',
      input: {
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        concept: 'Test',
        hook: 'Hook',
        offer: 'Offer',
        cta: 'CTA',
        messagingTheme: 'Theme',
        format: 'Format',
        targetAudience: 'Audience',
        destinationIntent: 'Intent'
      }
    };

    vi.mocked(aiGateway.generate).mockResolvedValue({
      provider: 'gemini',
      usage: { promptTokens: 10, completionTokens: 10 },
      content: {
        overall_score: 80,
        hook_score: 80,
        offer_score: 80,
        cta_score: 80,
        messaging_theme_score: 80,
        format_score: 80,
        strengths: ['Good'],
        weaknesses: ['Bad'],
        evidence: ['Fact'],
        recommendations: ['Do this']
      }
    });

    const worker = creativeBriefWorker as unknown as { processFn: (job: { id: string, data: typeof jobData }) => Promise<{status: string, data: Record<string, unknown>}> };
    const result = await worker.processFn({ id: '550e8400-e29b-41d4-a716-446655440006', data: jobData });
    expect(result.status).toBe('success');
    expect(aiGateway.generate).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      overall_score: 80,
      status: 'completed'
    }));
    expect(mockEq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440004');
  });
});
