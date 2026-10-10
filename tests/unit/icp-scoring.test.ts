import { describe, it, expect, vi } from 'vitest';
import { processLeadScoring } from '../../src/workers/icp-lead-scoring.worker';

// Mock Supabase Client
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: (table: string) => {
        const builder = {
          select: vi.fn().mockImplementation(() => builder),
          eq: vi.fn().mockImplementation(() => builder),
          single: vi.fn().mockImplementation(() => {
            if (table === 'leads') {
              return Promise.resolve({
                data: { id: '550e8400-e29b-41d4-a716-446655440008', organization_id: '550e8400-e29b-41d4-a716-446655440000', project_id: '550e8400-e29b-41d4-a716-446655440001', industry: 'software', company_size: '100-500' },
                error: null
              });
            }
            if (table === 'icp_profiles') {
              return Promise.resolve({
                data: { id: '550e8400-e29b-41d4-a716-446655440015' },
                error: null
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn().mockImplementation((resolve) => {
            if (table === 'icp_rules') {
              resolve({
                data: [
                  { id: '550e8400-e29b-41d4-a716-446655440010', rule_type: 'industry', operator: 'equals', value: 'software', weight: 50 },
                  { id: '550e8400-e29b-41d4-a716-446655440011', rule_type: 'company_size', operator: 'contains', value: '100', weight: 50 }
                ],
                error: null
              });
            }
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
          insert: vi.fn().mockResolvedValue({ error: null })
        };
        return builder;
      }
    })
  };
});

describe('ICP Lead Scoring Engine', () => {
  it('should calculate deterministic score based on rules', async () => {
    const result = await processLeadScoring('550e8400-e29b-41d4-a716-446655440006', {
      leadId: '550e8400-e29b-41d4-a716-446655440008',
      icpProfileId: '550e8400-e29b-41d4-a716-446655440015',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '550e8400-e29b-41d4-a716-446655440001'
    });
    
    expect(result.success).toBe(true);
    // Both rules match, so 100/100 -> 100
    expect(result.score).toBe(100);
    expect(result.status).toBe('excellent fit');
  });
});
