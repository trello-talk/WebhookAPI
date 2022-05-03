import { cutoffText } from '../../../util';
import { EventFunction } from '../../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_CARD_LIST',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.move_card', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50),
          list: cutoffText(data.listAfter.name, 50)
        }),
        description: data.embedDescription(['card', 'listBefore', 'listAfter'])
      },
      small: {
        description: _('webhooks.move_card', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`,
          list: cutoffText(data.listAfter.name, 25)
        })
      }
    });
  }
};
