import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_COMMENT',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.update_comment', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50)
        }),
        description: data.embedDescription(['card', 'list']),
        fields: [
          {
            name: '*' + _('trello.old_comment') + '*',
            value: cutoffText(data.oldData.text, 1024),
            inline: true
          },
          {
            name: '*' + _('trello.new_comment') + '*',
            value: cutoffText(data.action.data.action.text, 1024),
            inline: true
          }
        ]
      },
      small: {
        description: _('webhooks.update_comment', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`
        }),
        fields: [
          {
            name: '*' + _('trello.old_comment') + '*',
            value: cutoffText(data.oldData.text, 1024),
            inline: true
          },
          {
            name: '*' + _('trello.new_comment') + '*',
            value: cutoffText(data.action.data.action.text, 1024),
            inline: true
          }
        ]
      }
    });
  }
};
