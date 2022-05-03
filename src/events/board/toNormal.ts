import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'MAKE_NORMAL_MEMBER_OF_BOARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _(data.invoker.id === data.member.id ? 'webhooks.board_to_normal_self' : 'webhooks.board_to_normal', {
          member: data.invoker.webhookSafeName,
          member2: data.member.webhookSafeName
        }),
        description: data.embedDescription(['member'])
      },
      small: {
        description: _(data.invoker.id === data.member.id ? 'webhooks.board_to_normal_self' : 'webhooks.board_to_normal', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          member2: `[${data.member.webhookSafeName}](https://trello.com/${data.member.username}?utm_source=tacobot.app)`
        })
      }
    });
  }
};
