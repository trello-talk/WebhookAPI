import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'DELETE_ATTACHMENT_FROM_CARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.unattach_card', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50),
          attachment: cutoffText(data.attachment.name, 50)
        }),
        description: data.embedDescription(['card', 'list'])
      },
      small: {
        description: _('webhooks.unattach_card', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`,
          attachment: cutoffText(data.attachment.name, 25)
        })
      }
    });
  }
};
