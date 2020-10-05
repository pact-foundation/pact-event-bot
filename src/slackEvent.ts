import { WebClient } from "@slack/web-api";
import "source-map-support/register";
import { AsyncAPIGatewayProxyHandler } from ".";
import { getLogger } from "./logger";
import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "./responses";
import { setupTracing } from "./setupTracing";
import { getEnv } from "./utils/getEnv";
const CHANNEL_GENERAL = "C5F4KFKR8"
const CHANNEL_RANDOM = "C5F7CCDK7"

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
      return forbidden("Access Denied");
    }

    if (parsedEventBody.challenge) {
      challenge = parsedEventBody.challenge;
      log.info("Challenge present, responding back to slack");
      return ok(challenge);
    } else if (
      ["member_joined_channel", "team_join"].includes(
        parsedEventBody.event.type
      )
    ) {
      try {
        const eventData = parsedEventBody.event;
        log.info({ type: event }, "event recieved");
        let username;
        let userId;
        let text = "";
        let channel = CHANNEL_GENERAL;
        switch (eventData.type) {
          case "member_joined_channel": {
            userId = eventData.user;
            channel = eventData.channel;
            if ([CHANNEL_GENERAL, CHANNEL_RANDOM].includes(channel)) {
              log.info({}, "Joined known channel, responding")
              const userResult = await web.users.info({ user: userId });
              const user = userResult.user as any;
              username = user.real_name;
              text = `Hi ${username}, welcome to the Pact Foundation community! Please keep language-specific technical questions in the appropriate channel (e.g. #pact-js or #pact-jvm), and remember to use threads so we can keep the discussion focussed on your issue. Please also respect our community code of conduct (https://docs.pact.io/contributing/code-of-conduct). Thanks!`;
            } else {
              log.info({}, "channel not in included list, ignoring")
              ok()
            }
            break;
          }
          case "team_join": {
            log.info({}, "Joined team, responding with welcome message")
            const user = eventData.user;
            userId = user.id;
            username = user.real_name;
            text = `Hi ${username}, welcome to the Pact Foundation community! Please keep language-specific technical questions in the appropriate channel (e.g. #pact-js or #pact-jvm), and remember to use threads so we can keep the discussion focussed on your issue. Please also respect our community code of conduct (https://docs.pact.io/contributing/code-of-conduct). Thanks!`;
            break;
          }
          default:
            log.info({ type: eventData.type }, "ignoring unknown event type");
            ok();
        }

        const result = await web.chat.postEphemeral({
          text,
          channel,
          user: userId,
        });
        if (result.ok === true) {
          log.info({ result }, "slack ephemeral message successful");
          return ok();
        } else {
          log.error({ result }, "slack ephemeral message unsuccessful");
          return badRequest();
        }
      } catch (error) {
        log.error({ error }, "Failed to process slack event");
        return internalServerError();
      }
    }
    log.info({ event }, "Received event is not a slack challenge or event");

    return notFound();
  } catch (e) {
    log.error({ e, event }, "Bad Request");
    return badRequest(["Cannot process request"]);
  }
};
