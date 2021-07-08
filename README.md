# Taco WebhookAPI
The API to recieve webhook requests from Trello.

# Requirements
* PostgreSQL
* InfluxDB (optional)
* A running [Taco](https://github.com/trello-talk/Taco) instance

# Installation
* Clone the repo
* Copy and paste `.env.example` to `.env` and fill in variables.
  * `API_PORT` needs to be an open port that can recieve incoming requests.
* `npm i -g yarn`
* `yarn install`

# Usage
In a development environment: Run `yarn dev`
In a production environment: Run `yarn build`, then `yarn start`
