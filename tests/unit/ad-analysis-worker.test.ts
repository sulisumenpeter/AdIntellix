import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adAnalysisWorker } from '../../src/lib/queue/ad-analysis-worker';
import { analyzeAdvertisement } from '../../src/lib/intelligence/ad-analyzer';

vi.mock('../../src/lib/intelligence/ad-analyzer', () => ({
  analyzeAdvertisement: vi.fn()
}));

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('../../src/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: mockSelect.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      single: mockSingle
    })
  })
}));

describe('Ad Analysis Worker Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await adAnalysisWorker.close();
  });

  it('should analyze ad successfully', async () => {
    const jobData = {
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      advertisementId: '550e8400-e29b-41d4-a716-446655440002'
    };

    mockSingle
      .mockResolvedValueOnce({ data: { id: '550e8400-e29b-41d4-a716-446655440002', ad_text: 'Buy now', headline: 'Sale', cta_text: 'Shop', organization_id: '550e8400-e29b-41d4-a716-446655440000' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null }); // existing analysis = null

    vi.mocked(analyzeAdvertisement).mockResolvedValue({
      success: true,
      data: { hook: 'H', offer: 'O', cta: 'C', messaging_theme: 'M' }
    });

    const result = await (adAnalysisWorker as unknown as { processFn: (job: { id: string, data: unknown }) => Promise<unknown> }).processFn({ id: '550e8400-e29b-41d4-a716-446655440006', data: jobData }) as { status: string };
    expect(result.status).toBe('success');
    expect(analyzeAdvertisement).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440002', 'Buy now', 'Sale', 'Shop', '550e8400-e29b-41d4-a716-446655440000');
  });

  it('should skip if already analyzed', async () => {
    const jobData = {
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      advertisementId: '550e8400-e29b-41d4-a716-446655440002'
    };

    mockSingle
      .mockResolvedValueOnce({ data: { id: '550e8400-e29b-41d4-a716-446655440002', ad_text: 'Buy now' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'analysis-1' }, error: null }); // existing analysis

    const result = await (adAnalysisWorker as unknown as { processFn: (job: { id: string, data: unknown }) => Promise<unknown> }).processFn({ id: '550e8400-e29b-41d4-a716-446655440007', data: jobData }) as { status: string, reason: string };
    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('already_analyzed');
    expect(analyzeAdvertisement).not.toHaveBeenCalled();
  });
});
