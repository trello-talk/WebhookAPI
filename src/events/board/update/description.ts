import { EventFunction } from '../../../util/events';
import { cutoffText } from '../../../util';

export const event: EventFunction = {
  name: 'UPDATE_BOARD_DESC',
  async onEvent(data) {
    const _ = data.locale;
    const title = !data.oldData.desc
      ? 'webhooks.add_board_desc'
      : !data.board.desc
      ? 'webhooks.rem_board_desc'
      : 'webhooks.edit_board_desc';
    return data.send({
      default: {
        title: _(title, {
          member: data.invoker.webhookSafeName,
          board: cutoffText(data.board.name, 50)
        }),
        description: '',
        fields: [
          {
            name: '*' + _('trello.old_desc') + '*',
            value: cutoffText(data.oldData.desc, 1024),
            inline: true
          },
          {
            name: '*' + _('trello.new_desc') + '*',
            value: cutoffText(data.board.desc, 1024),
            inline: true
          }
        ].filter((v) => !!v.value)
      },
      small: {
        description: _(title, {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          board: cutoffText(data.board.name, 50)
        }),
        fields: [
          {
            name: '*' + _('trello.old_desc') + '*',
            value: cutoffText(data.oldData.desc, 1024),
            inline: true
          },
          {
            name: '*' + _('trello.new_desc') + '*',
            value: cutoffText(data.board.desc, 1024),
            inline: true
          }
        ].filter((v) => !!v.value)
      }
    });
  }
};
