import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatternDetectorService } from '../../src/lib/intelligence/pattern-detector';

const mockRpc = vi.fn();

const mockEq2 = vi.fn();
const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

vi.mock('../../src/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: mockRpc,
    from: () => ({ select: mockSelect })
  })
}));

describe('PatternDetectorService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch patterns successfully', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        { pattern_type: 'hook', pattern_value: 'Save 20%', occurrence_count: 5, first_observed: '2026-01-01', last_observed: '2026-01-05' }
      ],
      error: null
    });

    const patterns = await PatternDetectorService.getPatterns('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000');
    expect(patterns.length).toBe(1);
    expect(patterns[0].pattern_value).toBe('Save 20%');
    expect(mockRpc).toHaveBeenCalledWith('get_ad_patterns', { p_project_id: '550e8400-e29b-41d4-a716-446655440001', p_org_id: '550e8400-e29b-41d4-a716-446655440000' });
  });

  it('should detect long running ads', async () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
    
    mockEq2.mockResolvedValueOnce({
      data: [
        { 
          id: '550e8400-e29b-41d4-a716-446655440002', 
          advertiser_name: 'Test', 
          start_date: oldDate.toISOString(), 
          end_date: null, 
          is_active: true, 
          created_at: oldDate.toISOString() 
        },
        { 
          id: '550e8400-e29b-41d4-a716-446655440003', 
          advertiser_name: 'Test 2', 
          start_date: new Date().toISOString(), 
          end_date: null, 
          is_active: true, 
          created_at: new Date().toISOString() 
        }
      ],
      error: null
    });

    const longRunning = await PatternDetectorService.getLongRunningAds('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 30);
    expect(longRunning.length).toBe(1);
    expect(longRunning[0].id).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(longRunning[0].duration_days).toBeGreaterThanOrEqual(39);
  });
});
