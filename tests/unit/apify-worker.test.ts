import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { apifyWorker } from '../../src/lib/queue/apify-worker';
import { ApifyAdapter } from '../../src/lib/integrations/apify/apify-adapter';
import * as tracker from '../../src/lib/provenance/tracker';
import * as advModel from '../../src/lib/models/advertisement';
import * as adminSupabase from '../../src/lib/supabase/admin';
import { Job } from 'bullmq';

vi.mock('../../src/lib/integrations/apify/apify-adapter');
vi.mock('../../src/lib/provenance/tracker');
vi.mock('../../src/lib/models/advertisement');
vi.mock('../../src/lib/supabase/admin');

import * as client from '../../src/lib/queue/client';

vi.mock('bullmq', () => ({
  Worker: class {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(queueName: string, processFn: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).processFn = processFn;
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

describe('Apify Worker Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await apifyWorker.close();
    client.redisConnection.disconnect();
  });

  it('should reject invalid URL', async () => {
    const job = {
      id: '550e8400-e29b-41d4-a716-446655440006',
      data: {
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        source: 'test',
        actorId: 'actor',
        searchUrl: 'https://google.com',
        resultsLimit: 10
      }
    } as unknown as Job;
    
    // We expect the worker processor to throw
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processFn = (apifyWorker as any).processFn;
    await expect(processFn(job, 'token')).rejects.toThrow('Invalid job payload');
  });
  
  it('should process successfully with valid data', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '550e8400-e29b-41d4-a716-446655440001', organization_id: '550e8400-e29b-41d4-a716-446655440000' }, error: null })
    };
    vi.mocked(adminSupabase.createAdminClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof adminSupabase.createAdminClient>);

    const mockRunActor = vi.fn().mockResolvedValue([
      {
        external_ad_id: '123',
        platform: 'meta',
        advertiser_name: 'Test Advertiser',
        is_active: true,
        source_url: 'https://www.facebook.com/ads/library/?id=123',
        raw_source_metadata: {}
      }
    ]);
    ApifyAdapter.prototype.runFacebookAdsLibraryActor = mockRunActor;

    vi.mocked(advModel.upsertAdvertisement).mockResolvedValue('550e8400-e29b-41d4-a716-446655440002');

    const job = {
      id: '550e8400-e29b-41d4-a716-446655440007',
      data: {
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        source: 'test',
        actorId: 'actor',
        searchUrl: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=shopify',
        resultsLimit: 1
      }
    } as unknown as Job;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processFn = (apifyWorker as any).processFn;
    const result = await processFn(job, 'token');
    
    expect(result.status).toBe('success');
    expect(result.recordsDiscovered).toBe(1);
    expect(result.inserted).toBe(1);
    expect(result.skipped).toBe(0);
    
    expect(tracker.logDataProvenance).toHaveBeenCalled();
    expect(tracker.logHistoricalObservation).toHaveBeenCalled();
  });
});
