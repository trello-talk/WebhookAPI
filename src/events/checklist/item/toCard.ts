import { cutoffText, escapeMarkdown } from '../../../util';
import { EventFunction } from '../../../util/events';

export const event: EventFunction = {
  name: 'CONVERT_TO_CARD_FROM_CHECK_ITEM',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.checkitem_tocard', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50)
        }),
        description: data.embedDescription(['card', 'list']),
        fields: [
          {
            name: '*' + _('trello.item_src') + '*',
            value: [
              `**${_('words.card.one')}:** [${cutoffText(escapeMarkdown(data.sourceCard.name), 50)}](https://trello.com/c/${
                data.sourceCard.shortLink
              })`,
              `**${_('words.checklist.one')}:** ${cutoffText(escapeMarkdown(data.checklist.name), 50)}`
            ].join('\n')
          }
        ]
      },
      small: {
        description: _('webhooks.checkitem_tocard', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`
        })
      }
    });
  }
};
