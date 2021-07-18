import { InfluxDB } from 'influx';
import { CronJob } from 'cron';
import { logger } from '../logger';

export const client = new InfluxDB({
  database: process.env.INFLUX_DB_NAME,
  host: process.env.INFLUX_DB_HOST,
  port: parseInt(process.env.INFLUX_DB_PORT, 10),
  username: process.env.INFLUX_DB_USER,
  password: process.env.INFLUX_DB_PASSWORD
});

export const cron = new CronJob('*/5 * * * *', collect, null, false, 'America/New_York');

export let activeWebhooks: string[] = [];
export let webhooksSent = 0;

export function onWebhookSend(webhookID: string) {
  if (!activeWebhooks.includes(webhookID)) activeWebhooks.push(webhookID);

  webhooksSent++;
}

async function collect(timestamp = new Date()) {
  if (!process.env.INFLUX_DB_NAME) return;

  // Send to influx
  await client.writePoints([
    {
      measurement: 'webhook_traffic',
      tags: {},
      fields: {
        sent: webhooksSent,
        sentUnique: activeWebhooks.length
      },
      timestamp
    }
  ]);

  // Flush data for next cron run
  activeWebhooks = [];
  webhooksSent = 0;

  logger.log('Sent stats to Influx.');
}
