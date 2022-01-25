import { IncomingMessage, Server } from 'http';
import { createHmac } from 'crypto';
import { startTransaction, captureException, configureScope, addBreadcrumb, Severity } from '@sentry/node';
import { FastifyRequest, RouteOptions } from 'fastify';
import { RouteGenericInterface } from 'fastify/types/route';
import { logger } from './logger';
import { TrelloDefaultAction, TrelloPayload } from './util/types';
import { cardListMapCache, getListID } from './cache';
import { Webhook } from './db/postgres';
import { events, findFilter } from './util/events';
import WebhookData from './util/webhookData';
import WebhookFilters from './util/webhookFilters';

export const whitelistedIPs = process.env.WHITELISTED_IPS ? process.env.WHITELISTED_IPS.split(',') : [];

function validateRequest(request: FastifyRequest<RouteGenericInterface, Server, IncomingMessage>) {
  const { id } = request.params as { id: string };
  const content = JSON.stringify(request.body) + process.env.API_URL + id;
  const hash = createHmac('sha1', process.env.TRELLO_SECRET).update(content).digest('base64');
  return hash === request.headers['x-trello-webhook'];
}

async function canBeSent(webhook: Webhook, body: TrelloPayload<any>) {
  const actionData = body.action.data;
  const boardID = body.model.id;
  const list = actionData.list || actionData.listAfter;
  let listID = list ? list.id : null;
  const card = actionData.card;

  // No filtered cards or lists have been assigned
  if (!webhook.cards.length && !webhook.lists.length) return true;

  // No card was found on the event
  if (!card) return true;

  let allowed = true;

  // If there are list filters and no list was found on the event
  if (!listID && webhook.lists.length) {
    if (cardListMapCache.has(card.id)) listID = cardListMapCache.get(card.id)[1];
    else listID = await getListID(card.id, boardID, webhook);
  }

  // Whitelist policy
  if (webhook.whitelist) {
    allowed = false;

    if (webhook.cards.length) allowed = allowed || webhook.cards.includes(card.id);
    if (webhook.lists.length && listID) allowed = allowed || webhook.lists.includes(listID);
  } else {
    // Blacklist policy
    allowed = true;

    if (webhook.cards.length) allowed = !webhook.cards.includes(card.id);
    if (webhook.lists.length && listID) allowed = !(!allowed || webhook.lists.includes(listID));
  }

  return allowed;
}

export const headRoute: RouteOptions = {
  method: 'HEAD',
  url: '/:id',
  handler: async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f]{24}$/.test(id)) return reply.status(400).send('Bad request');
    else return reply.status(200).send('Ready to recieve.');
  }
};

export const route: RouteOptions = {
  method: 'POST',
  url: '/:id',
  handler: async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!/^[0-9a-f]{24}$/.test(id)) return reply.status(400).send('Bad request');

    const ip = (request.headers['x-forwarded-for'] as string) || request.ip;

    if (whitelistedIPs.length && !whitelistedIPs.includes(ip)) {
      return reply.status(401).send('Unauthorized');
    }

    if (!validateRequest(request)) {
      logger.info(`Failed webhook validation from request @ ${id}`, ip);
      return reply.status(401).send('Validation failed');
    }

    const body = request.body as TrelloPayload<TrelloDefaultAction>;
    const [filter, filterFound] = findFilter(body);

    const transaction = startTransaction({
      op: 'webhook.post',
      name: `Webhook ${id} POST: ${filter}`
    });

    configureScope((scope) => {
      scope.setSpan(transaction);
      scope.setTag('request.ownerID', id);
      scope.setTag('request.filter', filter);
      scope.setTag('request.filterFound', filterFound);
      scope.setTag('request.ip', ip);
      scope.setTag('request.boardID', body.model.id);
    });

    logger.log(
      `Incoming request @ ip=${ip} memberID=${id}, modelID=${body.model.id} filter=${filter}`,
      body.action.data
    );

    try {
      addBreadcrumb({
        category: 'filter',
        message: `Using filter: ${body.action.type} / ${filter}`,
        level: Severity.Info,
        data: body.action.data
      });

      if (!filterFound) {
        logger.info(`Unknown filter: ${body.action.type} / ${filter}`, body.action.data);
        transaction.finish();
        return reply.status(200).send('Recieved');
      }

      const webhooks = await Webhook.findAll({
        where: {
          modelID: body.model.id,
          memberID: id,
          active: true
        }
      });

      await Promise.all(
        webhooks.map(async (webhook) => {
          const data = new WebhookData(request, webhook, filter);
          const filters = new WebhookFilters(BigInt(webhook.filters));

          const allowed = await canBeSent(webhook, body);
          const postEvent = allowed && filters.has(filter) && webhook.webhookID;

          addBreadcrumb({
            category: 'webhook',
            message: `Webhook ${webhook.webhookID} ${
              allowed ? (postEvent ? 'posting' : 'allowed') : 'denied'
            }`,
            level: Severity.Info,
            data: {
              ...webhook.toJSON(),
              webhookToken: '<hidden>'
            }
          });

          if (postEvent) return events.get(filter).onEvent(data);
        })
      );

      reply.status(200).send('Recieved');
    } catch (e) {
      captureException(e);
      logger.error(e);
      reply.status(500).send('Internal error');
    } finally {
      transaction.finish();
    }
  }
};
