// A simple logger to abstract Sentry/PostHog tracking
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, meta || '');
  },
  error: (error: Error | unknown, meta?: Record<string, unknown>) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] ${message}`, meta || '');
    // Sentry.captureException(error, { extra: meta });
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta || '');
  },
};
