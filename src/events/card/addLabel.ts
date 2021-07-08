import { EventFunction } from '../../util/events';
import { cutoffText } from '../../util';

export const event: EventFunction = {
  name: 'ADD_LABEL_TO_CARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.card_add_label', {
          member: data.invoker.webhookSafeName,
          label: cutoffText(data.label.name, 25),
          card: cutoffText(data.card.name, 25)
        }),
        description: data.embedDescription(['label', 'card', 'list'])
      },
      small: {
        description: _('webhooks.card_add_label', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username})`,
          label: cutoffText(data.label.name, 25),
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink})`
        })
      }
    });
  }
};
