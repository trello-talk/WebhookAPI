import { EventFunction } from '../../util/events';
import { cutoffText } from '../../util';

export const event: EventFunction = {
  name: 'CREATE_LABEL',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.create_label', {
          member: data.invoker.webhookSafeName,
          label: cutoffText(data.label.name, 50)
        }),
        description: data.embedDescription(['label'])
      },
      small: {
        description: _('webhooks.create_label', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username})`,
          label: cutoffText(data.label.name, 25)
        })
      }
    });
  }
};
