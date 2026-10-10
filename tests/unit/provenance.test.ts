import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logDataProvenance, logHistoricalObservation } from '../../src/lib/provenance/tracker';
import { createAdminClient } from '../../src/lib/supabase/admin';
import { Queue } from 'bullmq';

vi.mock('../../src/lib/queue/client', () => ({
  redisConnection: {
    ping: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    quit: vi.fn(),
    on: vi.fn()
  }
}));

vi.mock('../../src/lib/supabase/admin', () => ({
  createAdminClient: vi.fn()
}));

vi.mock('bullmq', () => {
  return {
    Queue: class QueueMock {
      add = vi.fn().mockResolvedValue({ id: '123' });
      close = vi.fn().mockResolvedValue(undefined);
    },
    Worker: class WorkerMock {}
  };
});

describe('Data Provenance & Historical Observations', () => {
  let mockSupabase: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    const chainable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { creative_hash: 'old-hash' }, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      then: function (resolve: (val: unknown) => void) {
        resolve({ error: null });
      }
    };
    
    mockSupabase = {
      from: vi.fn().mockReturnValue(chainable),
      // we also need to attach the spies to the root so the assertions work!
      // wait, in the test I was asserting on mockSupabase.from, mockSupabase.upsert!
      // let me just spy on the chainable and re-assign mockSupabase's properties so assertions work.
      upsert: chainable.upsert,
      update: chainable.update,
      select: chainable.select,
      eq: chainable.eq,
      single: chainable.single
    };

    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  });

  it('should idempotently log data provenance and queue raw processing', async () => {
    await logDataProvenance({
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      source: 'meta-ads',
      rawContent: 'ad-data',
      processingStatus: 'raw',
      retentionStatus: 'permanent'
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('data_provenance_logs');
    expect(mockSupabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: '550e8400-e29b-41d4-a716-446655440000',
        processing_status: 'raw'
      }),
      { onConflict: 'organization_id,content_hash' }
    );
  });

  it('should idempotently log historical observation', async () => {
    await logHistoricalObservation({
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      advertisement_id: '550e8400-e29b-41d4-a716-446655440002',
      observation_date: '2026-10-01',
      status: 'active',
      creativeHash: 'new-hash'
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('advertisement_observations');
    expect(mockSupabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        advertisement_id: '550e8400-e29b-41d4-a716-446655440002',
        observation_date: '2026-10-01'
      }),
      { onConflict: 'advertisement_id,observation_date' }
    );
    
    // Checks creative change
    expect(mockSupabase.update).toHaveBeenCalledWith({ creative_hash: 'new-hash' });
  });
});
