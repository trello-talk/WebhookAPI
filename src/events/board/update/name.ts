import { cutoffText } from '../../../util';
import { EventFunction } from '../../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_BOARD_NAME',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.board_rename', {
          member: data.invoker.webhookSafeName,
          board: cutoffText(data.board.name, 50),
          oldName: cutoffText(data.oldData.name, 50)
        }),
        description: ''
      },
      small: {
        description: _('webhooks.board_rename', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          board: cutoffText(data.board.name, 50),
          oldName: cutoffText(data.oldData.name, 50)
        })
      }
    });
  }
};
