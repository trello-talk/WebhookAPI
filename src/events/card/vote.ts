import { EventFunction } from '../../util/events';
import { cutoffText } from '../../util';

export const event: EventFunction = {
  name: 'VOTE_ON_CARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _(data.action.data.voted ? 'webhooks.vote_card' : 'webhooks.unvote_card', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50)
        }),
        description: data.embedDescription(['card', 'list'])
      },
      small: {
        description: _(data.action.data.voted ? 'webhooks.vote_card' : 'webhooks.unvote_card', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${
            data.card.shortLink
          }?utm_source=tacobot.app)`
        })
      }
    });
  }
};
