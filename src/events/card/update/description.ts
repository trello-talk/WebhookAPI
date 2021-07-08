import { EventFunction } from '../../../util/events';
import { cutoffText } from '../../../util';

export const event: EventFunction = {
  name: 'UPDATE_CARD_DESC',
  async onEvent(data) {
    const _ = data.locale;
    const title = !data.oldData.desc
      ? 'webhooks.add_card_desc'
      : !data.card.desc
      ? 'webhooks.rem_card_desc'
      : 'webhooks.edit_card_desc';
    return data.send({
      default: {
        title: _(title, {
          member: data.invoker.webhookSafeName,
          card: cutoffText(data.card.name, 50)
        }),
        description: data.embedDescription(['card', 'list']),
        fields: [
          {
            name: '*' + _('trello.old_desc') + '*',
            value: cutoffText(data.oldData.desc, 1024),
            inline: true
          },
          {
            name: '*' + _('trello.new_desc') + '*',
            value: cutoffText(data.card.desc, 1024),
            inline: true
          }
        ].filter((v) => !!v.value)
      },
      small: {
        description: _(title, {
          member: `[${data.invoker.webhookSafeName}](https://trello.com/${data.invoker.username})`,
          card: `[${cutoffText(data.card.name, 25)}](https://trello.com/c/${data.card.shortLink})`
        }),
        fields: [
          {
            name: '*' + _('trello.old_desc') + '*',
            value: cutoffText(data.oldData.desc, 1024),
            inline: true
          },
          {
            name: '*' + _('trello.new_desc') + '*',
            value: cutoffText(data.card.desc, 1024),
            inline: true
          }
        ].filter((v) => !!v.value)
      }
    });
  }
};
