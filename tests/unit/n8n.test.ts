import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { N8nClient } from '../../src/lib/n8n/n8n-client';
import { logger } from '../../src/lib/observability/logger';
import { env } from '../../src/lib/env';

vi.mock('../../src/lib/observability/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

vi.mock('../../src/lib/env', () => ({
  env: {
    N8N_BASE_URL: 'https://n8n.marksman.blitz.cloud',
    N8N_API_KEY: 'test-key',
  }
}));

describe('N8nClient Integration Layer', () => {
  let n8n: N8nClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    n8n = new N8nClient();
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default or env base URL', () => {
    expect((n8n as unknown as { baseUrl: string }).baseUrl).toBe('https://n8n.marksman.blitz.cloud');
  });

  it('should trigger CRM sync webhook without awaiting full processing', async () => {
    await n8n.syncCrm('org-123', { lead: 'test' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://n8n.marksman.blitz.cloud/webhook/crm-sync-webhook');
    expect(logger.info).toHaveBeenCalledWith('Triggering n8n workflow: crm-sync-webhook');
  });

  it('should trigger intelligence collection webhook', async () => {
    await n8n.scheduleIntelligenceCollection('org-123', 'proj-123', { freq: 'daily' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://n8n.marksman.blitz.cloud/webhook/intelligence-collection-webhook');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      organizationId: 'org-123',
      projectId: 'proj-123',
      config: { freq: 'daily' }
    });
  });

  it('should trigger external API integration webhook', async () => {
    await n8n.triggerExternalIntegration('org-123', 'salesforce', { recordId: 'xyz' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://n8n.marksman.blitz.cloud/webhook/external-api-salesforce-webhook');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      organizationId: 'org-123',
      payload: { recordId: 'xyz' }
    });
  });

  it('should swallow fetch errors and log a warning if n8n sleeps or fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    await n8n.sendNotification('org-123', 'user-123', 'Test message');
    
    // Wait a tick for the unhandled promise catch in fire-and-forget
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(logger.warn).toHaveBeenCalledWith('n8n webhook notification-webhook transmission failed (may be sleeping)', { error: 'Network error' });
  });
});
