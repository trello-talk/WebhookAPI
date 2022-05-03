import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_LIST_POS',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.list_move', {
          member: data.invoker.webhookSafeName,
          list: cutoffText(data.list.name, 50)
        }),
        description: data.embedDescription(['list'])
      },
      small: {
        description: _('webhooks.list_move', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          list: cutoffText(data.list.name, 25)
        })
      }
    });
  }
};
