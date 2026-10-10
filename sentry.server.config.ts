import * as Sentry from "@sentry/nextjs";
import { env } from "./src/lib/env";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1,
    debug: false,
  });
}
