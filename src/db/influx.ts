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

export const activeWebhooks: string[] = [];
export const webhooksSent = 0;

export function onWebhookSend(webhookID: string) {
  if (!this.activeWebhooks.includes(webhookID)) this.activeWebhooks.push(webhookID);

  this.webhooksSent++;
}

async function collect(timestamp = new Date()) {
  // Send to influx
  await this.influx.writePoints({
    measurement: 'webhook_traffic',
    tags: {},
    fields: {
      sent: this.webhooksSent,
      sentUnique: this.activeWebhooks.length
    },
    timestamp
  });

  // Flush data for next cron run
  this.activeWebhooks = [];
  this.webhooksSent = 0;

  logger.log('Sent stats to Influx.');
}
