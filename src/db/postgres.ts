import Sequelize, { Model, Sequelize as newSequelize } from 'sequelize';

export const client = new newSequelize(process.env.PG_DATABASE, process.env.PG_USER, process.env.PG_PASSWORD, {
  host: process.env.PG_HOST,
  dialect: 'postgres',
  logging: false,
  define: { timestamps: true }
});

interface WebhookAttributes {
  id: number;
  memberID: string;
  modelID: string;
  trelloWebhookID: string;
  filters: string;
  active: boolean;
  locale: string;
  style: string;
  guildID: string;
  webhookID: string;
  webhookToken: string;
  threadID: string;
  threadParent: string;
  whitelist: string;
  lists: string[];
  cards: string[];
  // name: string;
}

export class Webhook extends Model<WebhookAttributes> implements WebhookAttributes {
  public id!: number;
  public memberID!: string;
  public modelID!: string;
  public trelloWebhookID!: string;
  public filters!: string;
  public active!: boolean;
  public locale!: string;
  public style!: string;
  public guildID!: string;
  public webhookID!: string;
  public webhookToken!: string;
  public threadID!: string;
  public threadParent!: string;
  public whitelist!: string;
  public lists!: string[];
  public cards!: string[];
  // public name!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Webhook.init(
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    memberID: Sequelize.STRING,
    modelID: {
      type: Sequelize.STRING,
      allowNull: false
    },
    trelloWebhookID: Sequelize.STRING,
    filters: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '0'
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    locale: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    },
    style: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'default'
    },
    guildID: {
      type: Sequelize.STRING,
      allowNull: false
    },
    webhookID: Sequelize.STRING,
    webhookToken: Sequelize.STRING,
    threadID: Sequelize.STRING,
    threadParent: Sequelize.STRING,
    whitelist: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lists: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    },
    cards: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    }
  },
  { sequelize: client, modelName: 'webhook' }
);

interface UserAttributes {
  userID: string;
  trelloToken: string;
  trelloID: string;
  discordToken: string;
  discordRefresh: string;
}

export const connect = (): Promise<unknown> => client.authenticate();

export const disconnect = (): Promise<void> => client.close();

export async function getUser(id: string): Promise<UserAttributes> {
  const user = (await client.query({
    query: 'SELECT * FROM users WHERE "userID"=?',
    values: [id]
  })) as [UserAttributes[], unknown];

  if (user[0][0]) return user[0][0];
}
