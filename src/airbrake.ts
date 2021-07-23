import { Notifier } from '@airbrake/node';
import { Webhook } from './db/postgres';

export const airbrake = new Notifier({
  projectId: parseInt(process.env.AIRBRAKE_PROJECT_ID, 10),
  projectKey: process.env.AIRBRAKE_PROJECT_KEY,
  environment: 'webhook-' + (process.env.AIRBRAKE_ENV || process.env.NODE_ENV),
  keysBlocklist: [process.env.TRELLO_SECRET, process.env.PG_PASSWORD, process.env.TRELLO_KEY]
});

export function notifyWebhookError(err: Error, webhook: Webhook, filterFlag: string) {
  if (process.env.AIRBRAKE_PROJECT_ID && process.env.AIRBRAKE_PROJECT_KEY)
    return airbrake.notify({
      error: err,
      params: {
        webhook: {
          errName: err.name,
          errCode: (err as any).code,
          id: webhook.webhookID,
          modelID: webhook.modelID,
          memberID: webhook.memberID,
          event: filterFlag
        }
      }
    });
}

export function notifyWebserverError(err: Error, ip: string, memberID: string, modelID: string) {
  if (process.env.AIRBRAKE_PROJECT_ID && process.env.AIRBRAKE_PROJECT_KEY)
    return airbrake.notify({
      error: err,
      params: {
        webserver: { ip, memberID, modelID }
      }
    });
}
