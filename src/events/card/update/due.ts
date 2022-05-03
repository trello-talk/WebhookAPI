import { cutoffText, formatTime } from '../../../util';
import { EventFunction } from '../../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_CARD_DUE',
  async onEvent(data) {
    const _ = data.locale;
    const changedKey = Object.keys(data.oldData)[0];
    if (changedKey === 'due') {
      const title = !data.oldData.due ? 'webhooks.due_add' : !data.card.due ? 'webhooks.due_remove' : 'webhooks.due_change';
      return data.send({
        default: {
          title: _(title, {
            member: data.invoker.webhookSafeName,
            card: cutoffText(data.card.name, 50)
          }),
          description: data.embedDescription(['card', 'list']),
          fields: [
            data.oldData.due
              ? {
                  name: '*' + _('trello.old_due') + '*',
                  value: formatTime(data.oldData.due),
                  inline: true
                }
              : null,
            data.card.due
              ? {
                  name: '*' + _('trello.new_due') + '*',
                  value: formatTime(data.card.due),
                  inline: true
                }
              : null
          ].filter((v) => !!v)
        },
        small: {
          description: _(title, {
            member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
            card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`
          }),
          fields: [
            data.oldData.due
              ? {
                  name: '*' + _('trello.old_due') + '*',
                  value: formatTime(data.oldData.due),
                  inline: true
                }
              : null,
            data.card.due
              ? {
                  name: '*' + _('trello.new_due') + '*',
                  value: formatTime(data.card.due),
                  inline: true
                }
              : null
          ].filter((v) => !!v)
        }
      });
    } else if (changedKey === 'dueComplete')
      return data.send({
        default: {
          title: _(data.card.dueComplete ? 'webhooks.due_on' : 'webhooks.due_off', {
            member: data.invoker.webhookSafeName,
            card: cutoffText(data.card.name, 50)
          }),
          description: data.embedDescription(['card', 'list'])
        },
        small: {
          description: _(data.card.dueComplete ? 'webhooks.due_on' : 'webhooks.due_off', {
            member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
            card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`
          })
        }
      });
  }
};
