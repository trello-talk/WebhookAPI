import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'REMOVE_MEMBER_FROM_CARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _(data.invoker.id === data.member.id ? 'webhooks.card_remove_self' : 'webhooks.card_remove_member', {
          member: data.invoker.webhookSafeName,
          member2: data.member.webhookSafeName,
          card: cutoffText(data.card.name, 50)
        }),
        description: data.embedDescription(['member', 'card', 'list'])
      },
      small: {
        description: _(data.invoker.id === data.member.id ? 'webhooks.card_remove_self' : 'webhooks.card_remove_member', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          member2: `[${data.member.webhookSafeName}](https://trello.com/${data.member.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`
        })
      }
    });
  }
};
