import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'DELETE_CUSTOM_FIELD',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.customfield_delete', {
          member: data.invoker.webhookSafeName,
          customField: cutoffText(data.customField.name, 50)
        }),
        description: ''
      },
      small: {
        description: _('webhooks.customfield_delete', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          customField: cutoffText(data.customField.name, 25)
        })
      }
    });
  }
};
