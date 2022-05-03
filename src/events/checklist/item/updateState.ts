import { cutoffText } from '../../../util';
import { EventFunction } from '../../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_CHECK_ITEM_STATE_ON_CARD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _(data.checklistItem.state === 'complete' ? 'webhooks.checkitem_state_on' : 'webhooks.checkitem_state_off', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50),
          checklistItem: cutoffText(data.checklistItem.name, 50)
        }),
        description: data.embedDescription(['card', 'list', 'checklist', 'checklistItem'])
      },
      small: {
        description: _(data.checklistItem.state === 'complete' ? 'webhooks.checkitem_state_on' : 'webhooks.checkitem_state_off', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`,
          checklistItem: cutoffText(data.checklistItem.name, 25)
        })
      }
    });
  }
};
