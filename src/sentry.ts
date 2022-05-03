import '@sentry/tracing';

import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new RewriteFrames({
      root: __dirname
    })
  ],

  environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  release: `webhook-api@${require('../package.json').version}`,
  tracesSampleRate: process.env.SENTRY_SAMPLE_RATE ? parseFloat(process.env.SENTRY_SAMPLE_RATE) : 1.0
});

export function close() {
  return Sentry.close();
}
