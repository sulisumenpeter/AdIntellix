import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../src/lib/observability/logger';
import { redisConnection } from '../../src/lib/queue/client';


// Mock dependencies
vi.mock('../../src/lib/observability/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }
}));

vi.mock('../../src/lib/queue/client', () => ({
  redisConnection: {
    disconnect: vi.fn(),
  },
  QUEUE_NAMES: {
    AD_INGESTION: 'ad-ingestion',
    AI_BATCH_ANALYSIS: 'ai-batch-analysis',
    WEB_CRAWLING: 'web-crawling',
    APIFY_INGESTION: 'apify-ingestion',
    AD_ANALYSIS: 'ad-analysis',
    CREATIVE_BRIEF_SCORING: 'creative-brief-scoring',
    AD_FATIGUE: 'ad-fatigue',
    LANDING_PAGE_MATCH: 'landing-page-match',
    GOOGLE_ADS_IMPORT: 'google-ads-import',
    ICP_LEAD_IMPORT: 'icp-lead-import',
    ICP_LEAD_SCORING: 'icp-lead-scoring',
    ICP_REPORT_GENERATION: 'icp-report-generation'
  },
  createQueue: vi.fn(),
}));

vi.mock('../../src/lib/ai/ai-gateway', () => ({
  aiGateway: {
    generate: vi.fn(),
  }
}));

vi.mock('bullmq', () => {
  return {
    Worker: function() {
      return {
        on: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
      };
    }
  };
});

describe('Worker Graceful Shutdown', () => {
  let originalExit: typeof process.exit;
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    vi.clearAllMocks();
    originalExit = process.exit;
    originalEnv = { ...process.env };
    process.env.ANTHROPIC_API_KEY = 'test_key';
    // @ts-expect-error - overriding process.exit for test
    process.exit = vi.fn();
  });

  afterEach(() => {
    process.exit = originalExit;
    process.env = originalEnv;
    vi.resetModules();
  });

  it('should register SIGTERM and SIGINT handlers', async () => {
    vi.resetModules();
    const processOnSpy = vi.spyOn(process, 'on');
    // Set NODE_ENV to something other than 'test' to force handler registration
    vi.stubEnv('NODE_ENV', 'production');
    await import('../../src/workers/index');
    
    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    
    vi.unstubAllEnvs();
  }, 60000);

  it('should cleanly close workers and redis connection', async () => {
    vi.resetModules();
    const indexModule = await import('../../src/workers/index');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workerCloseSpies = indexModule.workers.map((w: any) => vi.spyOn(w, 'close'));
    const redisDisconnectSpy = vi.spyOn(redisConnection, 'disconnect');

    await indexModule.gracefulShutdown('SIGTERM');

    // Should close every worker
    workerCloseSpies.forEach(spy => {
      expect(spy).toHaveBeenCalled();
    });

    // Should disconnect redis
    expect(redisDisconnectSpy).toHaveBeenCalled();
    
    // Should exit with 0
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should not run shutdown twice for repeated signals', async () => {
    // Reset the module state so isShuttingDown is false
    vi.resetModules();
    const indexModule = await import('../../src/workers/index');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workerCloseSpies = indexModule.workers.map((w: any) => vi.spyOn(w, 'close'));

    // Trigger twice
    const p1 = indexModule.gracefulShutdown('SIGTERM');
    const p2 = indexModule.gracefulShutdown('SIGINT');

    await Promise.all([p1, p2]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workerCloseSpies.forEach((spy: any) => {
      // should only be called once per worker despite multiple signals
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('should force exit if shutdown times out', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const indexModule = await import('../../src/workers/index');
    
    // Mock worker close to hang
    indexModule.workers[0].close = vi.fn().mockImplementation(() => new Promise(() => {}));
    
    const p = indexModule.gracefulShutdown('SIGTERM');
    expect(p).toBeDefined();
    
    // Advance timers to trigger timeout
    vi.advanceTimersByTime(35000);
    
    // The timeout forces exit(1)
    expect(process.exit).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });

  it('should handle worker close failure without hanging', async () => {
    vi.resetModules();
    const indexModule = await import('../../src/workers/index');
    
    // Mock a worker to fail closing
    indexModule.workers[0].close = vi.fn().mockRejectedValue(new Error('Failed to close'));
    
    await indexModule.gracefulShutdown('SIGTERM');
    
    // Should exit with 1 because of the error
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
