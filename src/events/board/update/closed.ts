import { cutoffText } from '../../../util';
import { EventFunction } from '../../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_BOARD_CLOSED',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _(data.board.closed ? 'webhooks.archive_board' : 'webhooks.unarchive_board', {
          member: data.invoker.webhookSafeName,
          board: cutoffText(data.board.name, 50)
        }),
        description: ''
      },
      small: {
        description: _(data.board.closed ? 'webhooks.archive_board' : 'webhooks.unarchive_board', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          board: cutoffText(data.board.name, 50)
        })
      }
    });
  }
};
