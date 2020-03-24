# Pact Event Bot

A slack event bot built with serverless/typescript/webpack using AWS Lambda & API Gateway, that will recieve slack events and respond to them in various ways

## Pre-requisites

- AWS Account
- Slack Account

### setup

1. run `yarn install` to install dependencies
2. run `sls deploy` to deploy the app
3. Add a slack app and click on `Event Subscriptions`
   1. You will be asked to enter a URL, enter the URL output the from Serverless deploy step
   2. This will respond to the verification challenge, and turn verified
      1. If you have issues, check the aws cloudfront logs for the slack bot lambda
   3. In the `Subscribe to events on behalf of users` section add the following
      - member_joined_channel
      - team_join
   4. Go to the `OAuth Tokens & Redirect URLs` page and in the `User Token Scopes` section add the following
      - channels:read
      - groups:read
      - users:read
4. Install the app to the workplace
5. On the app, go to the `Basic Information` page and get the Verification Token setting this as `SLACK_SIGNING_TOKEN` in your `.env` file
6. Create a `bot` custom integration in slack as a bot.
   1. Add a suitable bot name and image, This will be shown with the message.
   2. get the OAuth Access Token and set as `SLACK_TOKEN` in your `.env` file
7. In a terminal shell where the `SLACK_TOKEN` & `SLACK_SIGNING_TOKEN` env vars are available, run `sls deploy` again to deploy the application complete with slack tokens
8. Create a new user and join `General` and see the epehemeral message in action.
  ```
  Hi @member, welcome to the Pact Foundation community!
  Please join the relevant channels for your Pact implementation, so you can discuss your issues with the audience who can best help you.
  If you need help with an issue please check your DM from the pact-welcome-bot for more info.
  ```
