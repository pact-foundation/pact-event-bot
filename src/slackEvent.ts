import { WebClient } from "@slack/web-api";
import "source-map-support/register";
import { AsyncAPIGatewayProxyHandler } from ".";
import { getLogger } from "./logger";
import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok
} from "./responses";
import { setupTracing } from "./setupTracing";
import { getEnv } from "./utils/getEnv";

setupTracing();

export const handler: AsyncAPIGatewayProxyHandler = async (event, context) => {
  const { awsRequestId } = context;
  const rootLogger = getLogger({ name: getEnv("SERVICE_NAME") });
  const token = getEnv("SLACK_TOKEN");
  const verificationToken = getEnv("SLACK_SIGNING_TOKEN");
  const web = new WebClient(token);
  const log = rootLogger.child({ awsRequestId });

  log.info({ event }, "Slack handler invoked");
  let challenge: string = "";
  try {
    const eventBody = event.body || "";
    const parsedEventBody = JSON.parse(eventBody);

    if (parsedEventBody.token !== verificationToken) {
      log.info("Could not verify token");
      return forbidden();
    }

    if (parsedEventBody.challenge) {
      challenge = parsedEventBody.challenge;
      log.info("Challenge present, responding back to slack");
      return ok(challenge);
    } else if (
      ["member_joined_channel", "team_join"].indexOf(
        parsedEventBody.event.type
      ) + 1
    ) {
      try {
        const eventData = parsedEventBody.event;
        log.info({ type: event }, "event recieved");

        let username;
        let userId;
        let text = '';
        switch (eventData.type) {
          case "member_joined_channel": {
            userId = eventData.user;
            const userResult = await web.users.info({ user: userId });
            const user = userResult.user as any;
            username = user.real_name;
            text = `Hi @${username}, Thanks for joining a new Pact Foundation channel. Feel free to ask questions`;
            break;
          }
          case "team_join": {
            const user = eventData.data.user;
            userId = user.id;
            username = user.real_name;
            text = `Hi @${username}, welcome to the Pact Foundation community!\n\nPlease join the relevant channels for your Pact implementation, so you can discuss your issues with the audience who can best help you.\n\nIf you need help with an issue please check your DM from the pact-welcome-bot for more info.`;
            break;
          }
        }


        const result = await web.chat.postEphemeral({
          text,
          channel: eventData.channel,
          user: userId,
        });

        log.error({ result }, "slack ephemeral message successful");
        return ok();
      } catch (error) {
        log.error({ error }, "Failed to process slack event");
        return internalServerError();
      }
    }
    log.info({ event }, "Received event is not a slack challenge or event");

    return notFound();
  } catch (e) {
    log.error({ e, event }, "Bad Request");
    return badRequest();
  }
};
