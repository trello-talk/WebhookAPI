import { FastifyRequest } from 'fastify';
import { Webhook } from '../db/postgres';
import * as locale from './locale';
import lodash from 'lodash';
import Batcher from './batcher';
import {
  TrelloBoard,
  TrelloCard,
  TrelloCardSource,
  TrelloLabel,
  TrelloList,
  TrelloPayload,
  TrelloUser
} from './types';
import { cardListMapCache } from '../cache';
import { cutoffText, escapeMarkdown } from '.';
import { logger } from '../logger';
import { notifyWebhookError } from '../airbrake';
import { onWebhookSend } from '../db/influx';
import { request } from './request';

export const batches = new Map<string, Batcher>();

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
    return (
      this.action.type.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`).toUpperCase() !==
      this.filterFlag
    );
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
    return {
      avatar: member.avatarUrl ? member.avatarUrl + '/170.png' : null,
      webhookSafeName: member.fullName ? cutoffText(member.fullName, 50) : member.username,
      titleSafeName: member.fullName ? cutoffText(member.fullName, 256) : member.username,
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
    return member
      ? {
          avatar: member.avatarUrl ? member.avatarUrl + '/170.png' : null,
          webhookSafeName: member.fullName ? cutoffText(member.fullName, 50) : member.username,
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
      invoker: `**${_('words.member.one')}:** ${
        this.invoker.fullName
          ? `${cutoffText(this.invoker.fullName, 50)} (${this.invoker.username})`
          : this.invoker.username
      }`,
      member: this.member
        ? `**${_('words.member.one')}:** ${
            this.member.fullName
              ? `${cutoffText(this.member.fullName, 50)} (${this.member.username})`
              : this.action.member.username
          }`
        : '',
      card:
        this.card && this.card.name
          ? `**${_('words.card.one')}:** [${cutoffText(
              escapeMarkdown(this.card.name),
              50
            )}](https://trello.com/c/${this.card.shortLink})`
          : '',
      list:
        this.list && this.list.name
          ? `**${_('words.list.one')}:** ${cutoffText(escapeMarkdown(this.list.name), 50)}`
          : '',
      listBefore: this.listBefore
        ? `**${_('trello.prev_list')}:** ${cutoffText(escapeMarkdown(this.listBefore.name), 50)}`
        : '',
      listAfter: this.listAfter
        ? `**${_('trello.curr_list')}:** ${cutoffText(escapeMarkdown(this.listAfter.name), 50)}`
        : '',
      checklist:
        this.checklist && this.checklist.name
          ? `**${_('words.checklist.one')}:** ${cutoffText(escapeMarkdown(this.checklist.name), 50)}`
          : '',
      checklistItem:
        this.checklistItem && this.checklistItem.name
          ? `**${_('words.checklist_item.one')}:** ${cutoffText(escapeMarkdown(this.checklistItem.name), 50)}`
          : '',
      customField:
        this.customField && this.customField.type
          ? `**${_('trello.custom_field')} (${_(
              `custom_field_types.${this.customField.type}`
            )}):** ${cutoffText(escapeMarkdown(this.customField.name), 50)}`
          : '',
      label:
        this.label && this.label.name
          ? `**${_('words.label.one')}${
              this.label.color ? ` (${_(`trello.label_color.${this.label.color}`)})` : ''
            }:** ${cutoffText(escapeMarkdown(this.label.name), 50)}`
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
    if (this.card && (this.list || this.listAfter))
      cardListMapCache.set(this.card.id, [Date.now(), this.list ? this.list.id : this.listAfter.id]);

    const EMBED_DEFAULTS = {
      default: {
        color: this.isChildAction() ? DEFAULT_COLORS.CHILD : DEFAULT_COLORS[this.filterFlag.split('_')[0]],
        author: {
          icon_url: process.env.TRELLO_ICON_URL,
          name: 'Trello: ' + cutoffText(this.model.name, 248),
          url: this.model.url
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
          url: this.model.url
        },
        url: this.model.url,
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
          icon_url: process.env.ICON_URL,
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
      const batchKey = `compact:${this.model.id}:${this.webhook.webhookID}`;
      const compactLine = `\`${
        this.isChildAction() ? COMPACT_EMOJIS.CHILD : COMPACT_EMOJIS[this.filterFlag.split('_')[0]]
      }\` ${embedStyles.small.description}`;

      if (batches.has(batchKey))
        return (() => {
          batches.get(batchKey).add(compactLine);
        })();

      const batcher = new Batcher({
        maxTime: 2000,
        maxSize: 10
      });
      batches.set(batchKey, batcher);

      batcher.on('batch', (lines) => {
        batches.delete(batchKey);
        this._send(
          lodash.defaultsDeep(
            {
              description: lines.join('\n')
            },
            EMBED_DEFAULTS.compact
          )
        );
      });

      batcher.add(compactLine);
      return;
    }

    return this._batch(
      lodash.defaultsDeep(embedStyles[this.webhook.style], EMBED_DEFAULTS[this.webhook.style])
    );
  }

  /**
   * batches and sends the raw embed
   * @private
   */
  private async _batch(embed: any) {
    if (batches.has(this.webhook.webhookID))
      // Since Batcher#add returns a promise that resolves after a flush, this won't return the promise and
      // therefore won't halt the request until flushed.
      return (() => {
        batches.get(this.webhook.webhookID).add(embed);
      })();

    const batcher = new Batcher({
      maxTime: 1000,
      maxSize: 10
    });
    batches.set(this.webhook.webhookID, batcher);

    batcher.on('batch', async (embeds) => {
      batches.delete(this.webhook.webhookID);
      onWebhookSend(this.webhook.webhookID);
      logger.info(
        'Posting webhook %d (guild=%s, time=%d)',
        this.webhook.webhookID,
        this.webhook.guildID,
        Date.now()
      );
      return this._send(embeds);
    });

    batcher.add(embed);
  }

  private async _send(embeds: any[], attempt = 1) {
    try {
      return await request('POST', `/webhooks/${this.webhook.webhookID}/${this.webhook.webhookToken}`, {
        embeds
      });
    } catch (e) {
      if (e.name.startsWith('DiscordRESTError')) {
        if (e.code === 10015) {
          logger.warn(`Discord webhook lost @ ${this.webhook.webhookID}:${this.webhook.id}`, e);
          return await Webhook.update(
            {
              webhookID: null,
              webhookToken: null
            },
            { where: { id: this.webhook.id } }
          );
        } else {
          attempt++;
          if (attempt < 3) {
            logger.error(
              `Discord Error ${e.code}, exceeded attempts, dropping @ ${this.webhook.webhookID}:${this.webhook.id}`
            );
          } else {
            logger.warn(
              `Discord Error ${e.code}, retrying (${attempt}) @ ${this.webhook.webhookID}:${this.webhook.id}`
            );
            return this._send(embeds, attempt);
          }
        }
      } else if (e.message.startsWith('Request timed out (>15000ms)')) {
        attempt++;
        if (attempt < 3) {
          logger.error(
            `Request timed out, exceeded attempts, dropping @ ${this.webhook.webhookID}:${this.webhook.id}`
          );
        } else {
          logger.warn(
            `Request timed out, retrying (${attempt}) @ ${this.webhook.webhookID}:${this.webhook.id}`
          );
          return this._send(embeds, attempt);
        }
      } else {
        await notifyWebhookError(e, this.webhook, this.filterFlag);
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
