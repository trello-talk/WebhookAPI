import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'MOVE_CARD_TO_BOARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.move_in_card', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50)
        }),
        description: data.embedDescription(['card', 'list']) + `\n**${_('trello.from_board')}:** \`${data.sourceBoard.id}\``
      },
      small: {
        description: _('webhooks.move_in_card', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`
        })
      }
    });
  }
};
