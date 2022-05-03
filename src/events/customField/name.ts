import { cutoffText } from '../../util';
import { EventFunction } from '../../util/events';

export const event: EventFunction = {
  name: 'UPDATE_CUSTOM_FIELD_NAME',
  async onEvent(data) {
    const _ = data.locale;
    return data.send({
      default: {
        title: _('webhooks.customfield_rename', {
          member: data.invoker.webhookSafeName,
          customField: cutoffText(data.customField.name, 50),
          oldName: cutoffText(data.oldData.name, 50)
        }),
        description: ''
      },
      small: {
        description: _('webhooks.customfield_rename', {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username}?utm_source=tacobot.app)`,
          customField: cutoffText(data.customField.name, 25),
          oldName: cutoffText(data.oldData.name, 25)
        })
      }
    });
  }
};
