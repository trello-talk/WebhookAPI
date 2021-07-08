import { EventFunction } from '../../util/events';
import { cutoffText } from '../../util';

export const event: EventFunction = {
  name: 'COPY_CARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.copy_card', {
          member: data.invoker.webhookSafeName,
          sourceCard: cutoffText(data.sourceCard.name, 50),
          card: cutoffText(data.card.name, 50)
        }),
        description: data.embedDescription(['card', 'list'])
      },
      small: {
        description: _('webhooks.copy_card', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username})`,
          sourceCard: `[${cutoffText(data.sourceCard.name, 25)}](https://trello.com/c/${
            data.sourceCard.shortLink
          })`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink})`
        })
      }
    });
  }
};
