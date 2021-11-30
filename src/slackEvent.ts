import { WebClient } from "@slack/web-api";
import Logger from "bunyan";
import "source-map-support/register";
import { AsyncAPIGatewayProxyHandler } from ".";
import { getLogger } from "./logger";
import { badRequest, forbidden, internalServerError, ok } from "./responses";
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
        switch (eventData.type) {
          case "team_join": {
            log.info({}, "Joined team, responding with welcome message");
            const user = eventData.user;
            userId = user.id;
            username = user.real_name;
            const text = `👋 ${username}, welcome to the Pact Foundation community, we're so glad you're here!\n\nOur community is now over 3000 members, so to help keep things focussed, we have created several language-specific channels for technical questions - please start there before posting in #general (e.g. #pact-js or #pact-jvm). Also remember to use threads so we can keep the discussion focussed on your issue.\n\nIf you've come here from Pactflow, please be mindful that this is a combined Pactflow and Open Source community. Pactflow team members can be identified by their handle, and there is also a dedicated #pactflow channel for questions relating to the product.\n\nLastly, please take moment to read and respect our community code of conduct (https://docs.pact.io/contributing/code-of-conduct).  Thanks and looking forward to chatting with you!\n
            \n\n - The Pact Maintainers`;
            await welcomeUser(log, web, userId, text);
            break;
          }
          default:
            log.info({ type: eventData.type }, "ignoring unknown event type");
        }
      } catch (error) {
        log.error({ error }, "Failed to process slack event");
        return internalServerError();
      }
    }
    log.info({ event }, "Received event is not a slack challenge or event");

    return ok();
  } catch (e) {
    log.error({ e, event }, "Bad Request");
    return badRequest(["Cannot process request"]);
  }
};

const welcomeUser = async (
  log: Logger,
  client: WebClient,
  userId: string,
  text: string
): Promise<unknown> => {
  try {
    const conversation: any = await client.conversations.open({
      users: userId,
      return_im: true,
    });
    log.info({ conversation }, "conversation response");

    const privateChannel = conversation.channel.id;
    const result = await client.chat.postMessage({
      text,
      channel: privateChannel,
    });
    log.info({ result }, "conversation result");
  } catch (e) {
    log.error(e, {});

    return;
  }
};
