import { EventFunction } from '../../../util/events';
import { cutoffText } from '../../../util';

export const event: EventFunction = {
  name: 'UPDATE_CARD_CLOSED',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _(data.card.closed ? 'webhooks.archive_card' : 'webhooks.unarchive_card', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50)
        }),
        description: data.embedDescription(['card', 'list'])
      },
      small: {
        description: _(data.card.closed ? 'webhooks.archive_card' : 'webhooks.unarchive_card', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username})`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink})`
        })
      }
    });
  }
};
