import axios from 'axios';
import { CronJob } from 'cron';

import { getUser, Webhook } from './db/postgres';
import { available as redisAvailable, getCache, setCache } from './db/redis';
import { logger } from './logger';
import { cleanBuckets } from './util/request';

export const cardListMapCache = new Map<string, [number, string]>();

export function cacheCronTick() {
  cleanListIDCache();
  cleanBuckets();
}

export function cleanListIDCache() {
  Array.from(cardListMapCache).forEach(([cardID, [timestamp]]) => {
    if (timestamp < Date.now() + 1000 * 60 * 60 * 24) cardListMapCache.delete(cardID);
  });
}

export async function getListID(cardID: string, boardID: string, webhook: Webhook): Promise<string | null> {
  if (cardListMapCache.has(cardID)) return cardListMapCache.get(cardID)![1];

  if (redisAvailable) {
    const listID = await getCache('card:' + cardID);
    if (listID) return listID;
  }

  // Get board cards to cache for later
  const trelloMember = await getUser(webhook.memberID);

  if (trelloMember) {
    logger.log(`Caching cards for board ${boardID} for member ${webhook.memberID}`);
    const response = await axios.get(
      `https://api.trello.com/1/boards/${boardID}/cards?filter=open&fields=idList&key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_SECRET}`
    );

    if (response.status !== 200) {
      // Cache as null to prevent re-requesting
      cardListMapCache.set(cardID, [Date.now(), null]);
      logger.debug('Failed to cache list for card %s (board=%s, status=%s)', cardID, boardID, response.status);
      return null;
    } else {
      const cards = response.data as { id: string; idList: string }[];

      let resultID: string = null;
      for (const { id, idList } of cards) {
        if (id === cardID) resultID = idList;
        if (redisAvailable) {
          await setCache('card:' + id, idList);
        } else cardListMapCache.set(id, [Date.now(), idList]);
      }

      return resultID;
    }
  } else return null;
}

export const cron = new CronJob('0 0 * * * *', cleanListIDCache, null, false, 'America/New_York');
