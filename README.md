# Taco WebhookAPI
The API to recieve webhook requests from Trello.

# Prerequisites
* [PostgreSQL](https://www.postgresql.org/) ([download & install](https://www.postgresql.org/download/))
* [Redis](https://redis.io/) (optional, [quickstart](https://redis.io/topics/quickstart))
* [InfluxDB](https://docs.influxdata.com/influxdb) (optional, [install](https://docs.influxdata.com/influxdb/v1.8/introduction/install/))
* [Actional](https://github.com/Snazzah/Actional) (optional)
* A running [Taco](https://github.com/trello-talk/Taco) instance

# Installation
* Clone the repo
* Copy and paste `.env.example` to `.env` and fill in variables.
  * `API_PORT` needs to be an open port that can recieve incoming requests.
* `npm i -g yarn`
* `yarn install`

# Usage
In a development environment: Run `yarn dev`
In a production environment: Run `yarn build`, then `NODE_ENV=production yarn start`
Using PM2 in a production environment: Run `yarn build`, then `pm2 start pm2.json --env production`

# Useful Links
- [Clustering with PM2](https://pm2.io/blog/2018/04/20/Node-js-clustering-made-easy-with-PM2)
- [PM2 Application Declaration](https://pm2.keymetrics.io/docs/usage/application-declaration/)
