import path from 'path';
import { iterateFolder } from '.';
import { logger } from '../logger';
import WebhookData from './webhookData';
import WebhookFilters from './webhookFilters';
import { TrelloPayload } from './types';

export interface EventFunction {
  name: string;
  onEvent(data: WebhookData): void | Promise<void>;
}

export const events = new Map<string, EventFunction>();

export const load = () => iterateFolder(path.resolve(__dirname, '../events'), loadEvent);

export function loadEvent(filePath: string) {
  logger.debug('Loading event', filePath);
  const file = require(filePath);
  if (file.event) events.set(file.name, file.onEvent);
}

export function findFilter(payload: TrelloPayload<any>): [string, boolean] {
  const keyMap = {
    idList: 'list',
    dueComplete: 'due'
  };
  const snakeCaseAction = payload.action.type
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .toUpperCase();
  if (WebhookFilters.FLAGS[snakeCaseAction]) return [snakeCaseAction, events.has(snakeCaseAction)];

  if (exports.PARENT_FILTERS.includes(snakeCaseAction) && payload.action.data.old) {
    const keyChanged = Object.keys(payload.action.data.old)[0];
    const childAction = snakeCaseAction + '_' + (keyMap[keyChanged] || keyChanged).toUpperCase();
    if (WebhookFilters.FLAGS[childAction]) return [childAction, events.has(childAction)];
  }
}

export const PARENT_FILTERS = [
  'UPDATE_CARD',
  'UPDATE_CHECK_ITEM',
  'UPDATE_CHECKLIST',
  'UPDATE_LIST',
  'UPDATE_BOARD',
  'UPDATE_LABEL',
  'UPDATE_CUSTOM_FIELD'
];
