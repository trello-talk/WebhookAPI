import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'ADD_MEMBER_TO_BOARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _(data.invoker.id === data.member.id ? 'webhooks.board_join' : 'webhooks.board_add_member', {
          member: data.invoker.webhookSafeName,
          member2: data.member.webhookSafeName
        }),
        description:
          data.embedDescription(['member']) + `\n**${_('words.member_type.one')}:** ${_(`trello.member_type.${data.action.data.memberType}`)}`
      },
      small: {
        description: _(data.invoker.id === data.member.id ? 'webhooks.board_join' : 'webhooks.board_add_member', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          member2: `[${data.member.webhookSafeName}](https://trello.com/${data.member.username}?utm_source=tacobot.app)`
        })
      }
    });
  }
};
