# Pact Event Bot

A slack event bot built with serverless/typescript/webpack using AWS Lambda & API Gateway, that will recieve slack events and respond to them in various ways

## Pre-requisites

- AWS Account
- Slack Account

### setup a new bot

1. run `yarn install` to install dependencies
2. Install a slack app to the workplace
3. On the app, go to the `Basic Information` page and get the Verification Token setting this as `SLACK_SIGNING_TOKEN` in your `.env` file
4. run `SLACK_SIGNING_TOKEN=123 sls deploy` to deploy the app
5. Add a slack app and click on `Event Subscriptions`
   1. You will be asked to enter a URL, enter the URL output the from Serverless deploy step
   2. This will respond to the verification challenge, and turn verified
      1. If you have issues, check the aws cloudfront logs for the slack bot lambda
   3. In the `Subscribe to events on behalf of users` section add the following
      - member_joined_channel
      - team_join
   4. Go to the `OAuth Tokens & Redirect URLs` page and in the `User Token Scopes` section and check the following is enabled
      - channels:read
      - groups:read
      - users:read
6. Go to them `Install App` page and click to add the app to your workspace. You will be asked to grant permissions.
7. Search for an app called `bots` in the slack app directory
   1. Click Add to slack
   2. Add a suitable bot name and image, This will be shown with the message.
   3. get the API Token and set as `SLACK_TOKEN` in your `.env` file
8. Run `SLACK_SIGNING_TOKEN=123 SLACK_TOKEN-abc sls deploy` to deploy the application complete with slack tokens
9. Create a new user and join `General` and see an epehemeral message in action.

```
Hi member, welcome to the Pact Foundation community!
Please join the relevant channels for your Pact implementation, so you can discuss your issues with the audience who can best help you.
If you need help with an issue please check your DM from the welcome bot for more info.
```

10. Join a new channel and see an ephemeral message in action.

```
Hi member, Thanks for joining a new Pact Foundation channel. Feel free to ask questions
```

## Existing bot

See https://app.slack.com/app-settings/T5F60FXSQ/A017BFQ1XPB/app-manifest
