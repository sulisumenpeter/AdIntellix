import { PostHog } from 'posthog-node';
import { env } from '../env';

export const posthog = new PostHog(env.POSTHOG_KEY || 'mock-key', {
  host: env.POSTHOG_HOST || 'https://app.posthog.com',
  flushAt: 1,
  flushInterval: 0
});

// Avoid errors if API key is not configured locally
if (!env.POSTHOG_KEY) {
  posthog.capture = () => {};
}
