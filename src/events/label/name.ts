import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_LABEL_NAME',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.label_rename', {
          member: data.invoker.webhookSafeName,
          label: cutoffText(data.label.name, 50),
          oldName: cutoffText(data.oldData.name, 50)
        }),
        description: data.embedDescription(['label'])
      },
      small: {
        description: _('webhooks.label_rename', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          label: cutoffText(data.label.name, 25),
          oldName: cutoffText(data.oldData.name, 25)
        })
      }
    });
  }
};
