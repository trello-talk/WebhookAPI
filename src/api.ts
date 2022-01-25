import fastify, { FastifyInstance } from 'fastify';
import helmet from 'fastify-helmet';
import { logger } from './logger';
import { route, headRoute } from './endpoint';

import { connect as pgConnect, disconnect as pgDisconnect } from './db/postgres';
import { connect as actionalConnect, disconnect as actionalDisconnect } from './db/actional';
import { connect as redisConnect, disconnect as redisDisconnect } from './db/redis';
import { load as loadLocales } from './util/locale';
import { load as loadEvents } from './util/events';
import { cron as influxCron } from './db/influx';
import { cron as cacheCron } from './cache';
import { close as sentryClose } from './sentry';

export let server: FastifyInstance;

export async function start(): Promise<void> {
  server = fastify({
    logger: process.env.NODE_ENV !== 'production',
    ignoreTrailingSlash: true,
    bodyLimit: 262144 // 250KiB
  });

  cacheCron.start();
  influxCron.start();
  actionalConnect();
  await Promise.all([loadLocales(), loadEvents(), pgConnect(), redisConnect(), server.register(helmet)]);

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
  logger.info(`Running webhook on port ${port}, env: ${process.env.NODE_ENV || 'development'}`);

  // PM2 graceful start/shutdown
  if (process.send) process.send('ready');

  process.on('SIGINT', stop);
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection', err);
  });
}

export async function stop(): Promise<void> {
  logger.info('Shutting down...');
  cacheCron.stop();
  influxCron.stop();
  await server.close();
  await sentryClose();
  await pgDisconnect();
  redisDisconnect();
  actionalDisconnect();
  logger.info('All things disconnected.');
  process.exit(0);
}
