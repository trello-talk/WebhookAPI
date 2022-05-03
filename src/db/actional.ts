import { Client } from 'actional';

import { stop } from '../api';

export let client: Client = null;

export const connect = (): void => {
  if (process.env.ACTIONAL_URL && process.env.ACTIONAL_PASSWORD) {
    client = new Client(
      process.env.ACTIONAL_URL,
      {
        name: process.env.NODE_ENV === 'production' ? 'WebhookAPIProd' : 'WebhookAPIDev',
        priority: 1,
        rooms: ['webhookapi'],
        password: process.env.ACTIONAL_PASSWORD
      },
      // @ts-ignore
      {
        transports: ['websocket']
      }
    );

    client.defineEvent('shutdown', () => {
      return new Promise((resolve) => {
        resolve(null);
        stop();
      });
    });
  }
};

export const disconnect = (): void => {
  if (client) client.socket.disconnect();
};
