import { cutoffText, escapeMarkdown } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_CHECKLIST_NAME',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.checklist_rename', {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50),
          checklist: cutoffText(data.checklist.name, 50)
        }),
        description:
          data.embedDescription(['card', 'list', 'checklist']) +
          `\n**${_('trello.one_chklist_name')}:** ${cutoffText(escapeMarkdown(data.oldData.name), 50)}`
      },
      small: {
        description: _('webhooks.checklist_rename', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink}?utm_source=tacobot.app)`,
          checklist: cutoffText(data.checklist.name, 25)
        })
      }
    });
  }
};
