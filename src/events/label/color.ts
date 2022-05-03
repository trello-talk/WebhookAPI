import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_LABEL_COLOR',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.label_recolor', {
          member: data.invoker.webhookSafeName,
          label: cutoffText(data.label.name, 50),
          oldColor: data.oldData.color ? _(`trello.label_color.${data.oldData.color}`) : _('trello.label_color.none'),
          color: data.label.color ? _(`trello.label_color.${data.label.color}`) : _('trello.label_color.none')
        }),
        description: data.embedDescription(['label'])
      },
      small: {
        description: _('webhooks.label_recolor', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          label: cutoffText(data.label.name, 25),
          oldColor: data.oldData.color ? _(`trello.label_color.${data.oldData.color}`) : _('trello.label_color.none'),
          color: data.label.color ? _(`trello.label_color.${data.label.color}`) : _('trello.label_color.none')
        })
      }
    });
  }
};
