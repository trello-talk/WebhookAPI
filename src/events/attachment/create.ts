import { cutoffText, IMAGE_ATTACHMENT_HOST } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'ADD_ATTACHMENT_TO_CARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.attach_card', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50),
          attachment: cutoffText(data.attachment.name, 50)
        }),
        description: data.embedDescription(['attachment', 'card', 'list']),
        image: data.attachment.url && data.attachment.url.startsWith(IMAGE_ATTACHMENT_HOST) ? { url: data.attachment.url } : null
      },
      small: {
        description: _('webhooks.attach_card', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`,
          attachment: cutoffText(data.attachment.name, 25)
        }),
        thumbnail: data.attachment.url && data.attachment.url.startsWith(IMAGE_ATTACHMENT_HOST) ? { url: data.attachment.url } : null
      }
    });
  }
};
