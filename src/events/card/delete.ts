import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'DELETE_CARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.delete_card', {
          member: data.invoker.webhookSafeName,
          cardID: data.card.shortLink
        }),
        description: data.embedDescription(['list'])
      },
      small: {
        description: _('webhooks_extended.delete_card', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          cardID: data.card.shortLink,
          list: cutoffText(data.list.name, 25)
        })
      }
    });
  }
};
