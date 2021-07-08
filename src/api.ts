import fastify from 'fastify';
import helmet from 'fastify-helmet';
import middie from 'middie';
import { logger } from './logger';
import { route, headRoute } from './endpoint';

import { connect as pgConnect } from './db/postgres';
import { load as loadLocales } from './util/locale';
import { load as loadEvents } from './util/events';
import { cron as influxCron } from './db/influx';
import { job as cacheCron } from './cache';

export async function start(): Promise<void> {
  const server = fastify({
    logger: process.env.NODE_ENV !== 'production',
    ignoreTrailingSlash: true,
    bodyLimit: 262144 // 250KiB
  });

  cacheCron.start();
  influxCron.start();
  await Promise.all([
    loadLocales(),
    loadEvents(),
    pgConnect(),
    server.register(middie),
    server.register(helmet)
  ]);

  server.addHook('onRequest', async (req, reply) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    req.responseTimeCalc = process.hrtime();
    reply.headers({
      'X-Response-Time': process.hrtime(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      Connection: 'close'
    });
    return;
  });

  server.addHook('onSend', async (req, reply) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const diff = process.hrtime(req.responseTimeCalc);
    reply.header('X-Response-Time', diff[0] * 1e3 + diff[1] / 1e6);
    return;
  });

  server.route(headRoute);
  server.route(route);

  const port = parseInt(process.env.API_PORT, 10) || 3000;
  await server.listen({ port });
  logger.info(`Running webhook on port ${port}`);

  process.on('SIGINT', async function () {
    logger.info('Shutting down...');
    await server.close();
    process.exit(0);
  });
}
