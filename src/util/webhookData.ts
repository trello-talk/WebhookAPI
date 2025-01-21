import { captureException } from '@sentry/node';
import { FastifyRequest } from 'fastify';
import lodash from 'lodash';

import { cardListMapCache } from '../cache';
import { onWebhookSend } from '../db/influx';
import { Webhook } from '../db/postgres';
import { available as redisAvailable, batchHandoffs, client, subClient } from '../db/redis';
import { logger } from '../logger';
import { cutoffText, escapeMarkdown, isEmpty } from '.';
import Batcher, { BatcherOptions } from './batcher';
import * as locale from './locale';
import { request } from './request';
import { TrelloBoard, TrelloCard, TrelloCardSource, TrelloLabel, TrelloList, TrelloPayload, TrelloUser } from './types';

export const batches = new Map<string, Batcher>();

export interface TemporaryBatcherOptions<T = any> extends BatcherOptions {
  onBatch(arr: T[]): any;
}

async function createTemporaryBatcher<T = any>(id: string, data: T, options: TemporaryBatcherOptions<T>) {
  if (redisAvailable) {
    const count = await client.publish(`batch_handoff:${id}`, JSON.stringify(data));
    if (count > 0) {
      logger.log(`Batch ${id} passed off to ${count} clients.`);
      return;
    }
  }

  if (batches.has(id)) return batches.get(id).add(data);

  const batcher = new Batcher<T>(options);
  batches.set(id, batcher);
  batcher.on('batch', async (arr) => {
    batches.delete(id);
    if (redisAvailable) {
      batchHandoffs.delete(id);
      await subClient.unsubscribe(`batch_handoff:${id}`);
    }
    return options.onBatch(arr);
  });
  batcher.add(data);

  if (redisAvailable) {
    batchHandoffs.set(id, batcher);
    await subClient.subscribe(`batch_handoff:${id}`);
  }
}

interface ExtendedTrelloUser extends TrelloUser {
  avatar?: string | null;
  webhookSafeName?: string;
}

export default class WebhookData {
  request: FastifyRequest;
  webhook: Webhook;
  locale: locale.LocaleModule;
  /** The filter flag this is representing */
  filterFlag: string;

  constructor(request: FastifyRequest, webhook: Webhook, filterFlag: string) {
    this.request = request;
    this.webhook = webhook;

    this.filterFlag = filterFlag;
    this.locale = locale.toModule(this.webhook.locale);
  }

  /**
   * Whether the request is representing a child action
   */
  isChildAction() {
    return this.action.type.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`).toUpperCase() !== this.filterFlag;
  }

  /**
   * The body of the request
   */
  get body() {
    return this.request.body as TrelloPayload<any>;
  }

  /**
   * The model that this action is for
   */
  get model() {
    return this.body.model;
  }

  /**
   * The action data
   */
  get action() {
    return this.body.action;
  }

  /**
   * The user who started the event
   */
  get invoker() {
    const member = this.action.memberCreator;
    const name = this.action.display?.entities?.memberCreator?.text ?? member.fullName;
    return {
      avatar: member.avatarUrl ? member.avatarUrl + '/170.png' : null,
      webhookSafeName: !isEmpty(name) ? cutoffText(name, 50) : member.username,
      titleSafeName: !isEmpty(name) ? cutoffText(name, 256) : member.username,
      ...member
    };
  }

  // #region action data shorthands
  /**
   * The old data from the action
   */
  get oldData() {
    return this.action.data.old;
  }

  /**
   * The board represented from the action
   */
  get board(): TrelloBoard {
    return this.action.data.board;
  }

  /**
   * The target board represented from the action
   */
  get targetBoard() {
    return this.action.data.boardTarget;
  }

  /**
   * The source board represented from the action
   */
  get sourceBoard() {
    return this.action.data.boardSource;
  }

  /**
   * The label represented from the action
   */
  get label(): TrelloLabel {
    return this.action.data.label;
  }

  /**
   * The attachment represented from the action
   */
  get attachment() {
    return this.action.data.attachment;
  }

  /**
   * The member represented from the action
   */
  get member(): ExtendedTrelloUser {
    const member = this.action.member;
    const name = this.action.display?.entities?.member?.text ?? member?.fullName;
    return member
      ? {
          avatar: member.avatarUrl ? member.avatarUrl + '/170.png' : null,
          webhookSafeName: !isEmpty(name) ? cutoffText(name, 50) : member.username,
          ...member
        }
      : member;
  }

  /**
   * The card represented from the action
   */
  get card(): TrelloCard {
    return this.action.data.card;
  }

  /**
   * The source card represented from the action
   */
  get sourceCard(): TrelloCardSource {
    return this.action.data.cardSource;
  }

  /**
   * The list represented from the action
   */
  get list(): TrelloList {
    return this.action.data.list;
  }

  /**
   * The list before represented from the action
   */
  get listBefore() {
    return this.action.data.listBefore;
  }

  /**
   * The list after represented from the action
   */
  get listAfter() {
    return this.action.data.listAfter;
  }

  /**
   * The checklist represented from the action
   */
  get checklist() {
    return this.action.data.checklist;
  }

  /**
   * The source checklist represented from the action
   */
  get sourceChecklist() {
    return this.action.data.checklistSource;
  }

  /**
   * The checklist item represented from the action
   */
  get checklistItem() {
    return this.action.data.checkItem;
  }

  /**
   * The custom field represented from the action
   */
  get customField() {
    return this.action.data.customField;
  }

  /**
   * The custom field item represented from the action
   */
  get customFieldItem() {
    return this.action.data.customFieldItem;
  }
  // #endregion

  embedDescription(fields = null) {
    const _ = this.locale;
    const lines = {
      invoker: `**${_('words.member.one')}:** [${
        this.invoker.fullName ? `${cutoffText(this.invoker.fullName, 50)} (${this.invoker.username})` : this.invoker.username
      }](https://trello.com/${this.invoker.username}?utm_source=tacobot.app)`,
      member: this.member
        ? `**${_('words.member.one')}:** [${
            this.member.fullName ? `${cutoffText(this.member.fullName, 50)} (${this.member.username})` : this.member.username
          }](https://trello.com/${this.member.username}?utm_source=tacobot.app)`
        : '',
      card:
        this.card && this.card.name
          ? `**${_('words.card.one')}:** [${cutoffText(escapeMarkdown(this.card.name), 50)}](https://trello.com/c/${
              this.card.shortLink
            }?utm_source=tacobot.app)`
          : '',
      list: this.list && this.list.name ? `**${_('words.list.one')}:** ${cutoffText(escapeMarkdown(this.list.name), 50)}` : '',
      listBefore: this.listBefore ? `**${_('trello.prev_list')}:** ${cutoffText(escapeMarkdown(this.listBefore.name), 50)}` : '',
      listAfter: this.listAfter ? `**${_('trello.curr_list')}:** ${cutoffText(escapeMarkdown(this.listAfter.name), 50)}` : '',
      checklist:
        this.checklist && this.checklist.name ? `**${_('words.checklist.one')}:** ${cutoffText(escapeMarkdown(this.checklist.name), 50)}` : '',
      checklistItem:
        this.checklistItem && this.checklistItem.name
          ? `**${_('words.checklist_item.one')}:** ${cutoffText(escapeMarkdown(this.checklistItem.name), 50)}`
          : '',
      customField:
        this.customField && this.customField.type
          ? `**${_('trello.custom_field')} (${_(`custom_field_types.${this.customField.type}`)}):** ${cutoffText(
              escapeMarkdown(this.customField.name),
              50
            )}`
          : '',
      label:
        this.label && this.label.name
          ? `**${_('words.label.one')}${this.label.color ? ` (${_(`trello.label_color.${this.label.color}`)})` : ''}:** ${cutoffText(
              escapeMarkdown(this.label.name),
              50
            )}`
          : '',
      attachment:
        this.attachment && this.attachment.name
          ? `**${_('words.attachment.one')}:** ${
              this.attachment.url
                ? `[${cutoffText(escapeMarkdown(this.attachment.name), 50)}](${this.attachment.url})`
                : cutoffText(escapeMarkdown(this.attachment.name), 50)
            }`
          : ''
    };
    if (!fields) fields = Object.keys(lines);
    return fields
      .map((f: string | number) => lines[f])
      .filter((v: any) => !!v)
      .join('\n');
  }

  /**
   * Sends the embed to the webhook
   * @param {Object<string, Object>} embedStyles The embeds for each style
   */
  async send(embedStyles: Record<string, any>) {
    // Update card-list pairing cache
    if (this.card && (this.list || this.listAfter)) cardListMapCache.set(this.card.id, [Date.now(), this.list ? this.list.id : this.listAfter.id]);

    const webhookBatchKey = `${this.webhook.webhookID}${this.webhook.threadID ? `:${this.webhook.threadID}` : ''}`;

    const EMBED_DEFAULTS = {
      default: {
        color: this.isChildAction() ? DEFAULT_COLORS.CHILD : DEFAULT_COLORS[this.filterFlag.split('_')[0]],
        author: {
          icon_url: process.env.TRELLO_ICON_URL,
          name: 'Trello: ' + cutoffText(this.model.name, 248),
          url: `${this.model.url}?utm_source=tacobot.app`
        },
        description: embedStyles.default.description || this.embedDescription(),
        ...(this.invoker.avatar
          ? {
              thumbnail: { url: this.invoker.avatar }
            }
          : {}),
        timestamp: this.action.date,
        footer: {
          icon_url: 'https://tacobot.app/logo_happy.png',
          text: 'tacobot.app'
        }
      },
      small: {
        color: this.isChildAction() ? DEFAULT_COLORS.CHILD : DEFAULT_COLORS[this.filterFlag.split('_')[0]],
        author: {
          ...(this.invoker.avatar
            ? {
                icon_url: this.invoker.avatar
              }
            : {}),
          name: this.invoker.titleSafeName,
          url: `${this.model.url}?utm_source=tacobot.app`
        },
        url: `${this.model.url}?utm_source=tacobot.app`,
        title: cutoffText(this.model.name, 256),
        timestamp: this.action.date,
        footer: {
          icon_url: 'https://tacobot.app/logo_happy.png',
          text: 'tacobot.app'
        }
      },
      compact: {
        color: 3092790,
        author: {
          icon_url: process.env.TRELLO_ICON_URL,
          name: 'Trello: ' + cutoffText(this.model.name, 248),
          url: this.model.url
        },
        timestamp: this.action.date,
        footer: {
          icon_url: 'https://tacobot.app/logo_happy.png',
          text: 'tacobot.app'
        }
      }
    };

    if (this.webhook.style === 'compact') {
      const batchKey = `compact:${this.model.id}:${this.webhook.webhookID}:${this.webhook.threadID ?? '-'}`;
      const compactLine = `\`${this.isChildAction() ? COMPACT_EMOJIS.CHILD : COMPACT_EMOJIS[this.filterFlag.split('_')[0]]}\` ${
        embedStyles.small.description
      }`;

      createTemporaryBatcher(batchKey, compactLine, {
        maxTime: 2000,
        maxSize: 10,
        onBatch: (lines) => {
          createTemporaryBatcher(webhookBatchKey, lodash.defaultsDeep({ description: lines.join('\n') }, EMBED_DEFAULTS.compact), {
            maxTime: 1000,
            maxSize: 10,
            onBatch: (embeds) => {
              onWebhookSend(webhookBatchKey);
              logger.info(
                'Posting webhook %s (guild=%s, time=%d, thread=%s)',
                this.webhook.webhookID,
                this.webhook.guildID,
                Date.now(),
                this.webhook.threadID ?? 'none'
              );
              return this._send(embeds);
            }
          });
        }
      });
      return;
    }

    return createTemporaryBatcher(webhookBatchKey, lodash.defaultsDeep(embedStyles[this.webhook.style], EMBED_DEFAULTS[this.webhook.style]), {
      maxTime: 1000,
      maxSize: 10,
      onBatch: (embeds) => {
        onWebhookSend(webhookBatchKey);
        logger.info(
          'Posting webhook %s (guild=%s, time=%d, thread=%s)',
          this.webhook.webhookID,
          this.webhook.guildID,
          Date.now(),
          this.webhook.threadID ?? 'none'
        );
        return this._send(embeds);
      }
    });
  }

  private async _send(embeds: any[], attempt = 1) {
    const thread = this.webhook.threadID;
    try {
      await request('POST', `/webhooks/${this.webhook.webhookID}/${this.webhook.webhookToken}${thread ? `?thread_id=${thread}` : ''}`, {
        embeds
      });
    } catch (e) {
      if (e.name.startsWith('DiscordRESTError')) {
        if (e.code === 10015) {
          logger.warn(`Discord webhook lost @ ${this.webhook.webhookID}:${this.webhook.id}`, e);
          await Webhook.update(
            {
              webhookID: null,
              webhookToken: null,
              threadID: null,
              threadParent: null
            },
            { where: { id: this.webhook.id } }
          );
        } else if (e.code === 50027) {
          logger.warn(`Discord webhook token invalid, dropping @ ${this.webhook.webhookID}:${this.webhook.id}`, e);
          await Webhook.update(
            {
              webhookID: null,
              webhookToken: null,
              threadID: null,
              threadParent: null
            },
            { where: { id: this.webhook.id } }
          );
        } else if (e.code === 10003) {
          logger.warn(`Discord webhook points to a lost thread, removing thread setting @ ${this.webhook.webhookID}:${this.webhook.id}`, e);
          await Webhook.update(
            {
              threadID: null,
              active: false
            },
            { where: { id: this.webhook.id } }
          );
        } else if (e.code === 160005) {
          logger.warn(`Discord webhook points to a locked thread, removing thread setting @ ${this.webhook.webhookID}:${this.webhook.id}`, e);
          await Webhook.update(
            {
              threadID: null,
              active: false
            },
            { where: { id: this.webhook.id } }
          );
        } else if (e.code === 220001) {
          logger.warn(`Discord webhook tried posting to forum channel with no thread id @ ${this.webhook.webhookID}:${this.webhook.id}`, e);
          await Webhook.update(
            {
              threadParent: '0',
              active: false
            },
            { where: { id: this.webhook.id } }
          );
        } else if (e.status === 400) {
          logger.error(`Invalid form body, dropping @ ${this.webhook.webhookID}:${this.webhook.id} - ${this.filterFlag}`, e);
        } else {
          attempt++;
          if (attempt > 3) {
            logger.error(`Discord Error ${e.code} (${e.status}), exceeded attempts, dropping @ ${this.webhook.webhookID}:${this.webhook.id}`, e);
          } else {
            logger.warn(`Discord Error ${e.code} (${e.status}), retrying (${attempt}) @ ${this.webhook.webhookID}:${this.webhook.id}`);
            return this._send(embeds, attempt);
          }
        }
      } else if (e.name === 'DiscordHTTPError' && e.code >= 500) {
        attempt++;
        if (attempt < 3) {
          logger.error(`Discord server error, exceeded attempts, dropping @ ${this.webhook.webhookID}:${this.webhook.id}`);
        } else {
          logger.warn(`Discord server error, retrying (${attempt}) @ ${this.webhook.webhookID}:${this.webhook.id}`);
          return this._send(embeds, attempt);
        }
      } else if (e.message.startsWith('Request timed out (>15000ms)')) {
        attempt++;
        if (attempt < 3) {
          logger.error(`Request timed out, exceeded attempts, dropping @ ${this.webhook.webhookID}:${this.webhook.id}`);
        } else {
          logger.warn(`Request timed out, retrying (${attempt}) @ ${this.webhook.webhookID}:${this.webhook.id}`);
          return this._send(embeds, attempt);
        }
      } else {
        captureException(e, {
          tags: {
            webhook: this.webhook.id,
            discordWebhook: this.webhook.webhookID
          }
        });
        logger.error(`Webhook execution failed @ ${this.webhook.webhookID}:${this.webhook.id}`, e);
      }
    }
  }
}

export const DEFAULT_COLORS = {
  ADD: 0x2ecc71,
  CREATE: 0x16a085,
  UPDATE: 0xe67e22,
  CHILD: 0xf1c40f,
  UNCONFIRMED: 0xf1c40f,
  REMOVE: 0xe74c3c,
  DELETE: 0xc0392b,
  ENABLE: 0x95a5a6,
  DISABLE: 0x34495e,
  MAKE: 0x3498db,
  MEMBER: 0x3498db,
  VOTE: 0x2980b9,
  EMAIL: 0xecf0f1,
  COMMENT: 0xff9f43,
  CONVERT: 0x9b59b6,
  COPY: 0xf19066,
  MOVE: 0xb53471
};

export const COMPACT_EMOJIS = {
  ADD: '🟢',
  CREATE: '🟩',
  UPDATE: '🟧',
  CHILD: '🟡',
  UNCONFIRMED: '🟠',
  REMOVE: '🔴',
  DELETE: '🟥',
  ENABLE: '✅',
  DISABLE: '❎',
  MAKE: '🟦',
  MEMBER: '🔵',
  VOTE: '🗳️',
  EMAIL: '📧',
  COMMENT: '💬',
  CONVERT: '📇',
  COPY: '📋',
  MOVE: '📦'
};
