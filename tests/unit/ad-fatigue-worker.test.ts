import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import * as fatigueDetector from '../../src/lib/intelligence/ad-fatigue-detector';

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

import { adFatigueWorker } from '../../src/lib/queue/ad-fatigue-worker';

const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockUpsert = vi.fn();

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
      if (table === 'advertisement_observations') {
        return {
          select: mockSelect.mockReturnThis(),
          eq: mockEq.mockReturnThis(),
          order: mockOrder
        };
      }
      if (table === 'ad_fatigue_reports') {
        return {
          upsert: mockUpsert
        };
      }
      return {};
    }
  })
}));

describe('Ad Fatigue Worker Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await adFatigueWorker.close();
  });

  it('should detect fatigue for old ads correctly', async () => {
    const jobData = {
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      advertisementId: '550e8400-e29b-41d4-a716-446655440002'
    };

    // ad single
    mockSingle.mockResolvedValueOnce({
      data: {
        start_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
      },
      error: null
    });

    // obs order
    mockOrder.mockResolvedValueOnce({
      data: [
        { observation_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), status: 'active' },
        { observation_date: new Date().toISOString(), status: 'active' }
      ],
      error: null
    });

    mockUpsert.mockResolvedValueOnce({ error: null });

    const worker = adFatigueWorker as unknown as { processFn: (job: { id: string, data: typeof jobData }) => Promise<{status: string, data: Record<string, unknown>}> };
    const result = await worker.processFn({ id: '550e8400-e29b-41d4-a716-446655440006', data: jobData });
    expect(result.status).toBe('success');
    expect(result.data.fatigueStatus).toBe('fatigued');
    expect(result.data.fatigueScore).toBeGreaterThan(69); // 30 + 40
    expect(mockUpsert).toHaveBeenCalled();
  });
});
