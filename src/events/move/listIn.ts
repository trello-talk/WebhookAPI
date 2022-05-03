import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'MOVE_LIST_TO_BOARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.move_in_list', {
          member: data.invoker.webhookSafeName,
          list: cutoffText(data.list.name, 50)
        }),
        description: data.embedDescription(['list']) + `\n**${_('trello.from_board')}:** \`${data.sourceBoard.id}\``
      },
      small: {
        description: _('webhooks.move_in_list', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          list: cutoffText(data.list.name, 25)
        })
      }
    });
  }
};
