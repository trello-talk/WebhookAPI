import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'COMMENT_CARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.commented', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50)
        }),
        description: data.embedDescription(['card', 'list']),
        fields: [
          {
            name: '*' + _('words.comment.one') + '*',
            value: cutoffText(data.action.data.text, 1024)
          }
        ]
      },
      small: {
        description: _('webhooks.commented', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`
        }),
        fields: [
          {
            name: '*' + _('words.comment.one') + '*',
            value: cutoffText(data.action.data.text, 1024)
          }
        ]
      }
    });
  }
};
