import { APIGatewayEvent, Context } from "aws-lambda";
import { getLogger } from "./logger";
import { handler } from "./slackEvent";

// Setup Mocks

// Logger
import { getMockLogger } from "./test/utils/mockLogger";
jest.mock("./logger");
(getLogger as jest.Mock).mockReturnValue(getMockLogger());

// Slack API
let mockpostEphemeral = jest.fn().mockResolvedValue({ ok: true });
const mockUserInfo = jest
  .fn()
  .mockResolvedValue({ user: { real_name: "Test" } });
jest.mock("@slack/web-api", () => {
  return {
    WebClient: jest.fn().mockImplementation(() => {
      return {
        chat: {
          postEphemeral: mockpostEphemeral,
        },
        users: {
          info: mockUserInfo,
        },
      };
    }),
  };
});

// Setup default lambda context
const context: Context = {
  awsRequestId: "asdfasdfasdfads",
  callbackWaitsForEmptyEventLoop: false,
  functionName: "woop",
  functionVersion: "221",
  invokedFunctionArn: "arn:123",
  memoryLimitInMB: "123",
  logGroupName: "group",
  logStreamName: "pact-event-bot",
  getRemainingTimeInMillis: () => 180,
  done: () => ({}),
  fail: () => ({}),
  succeed: () => ({}),
};



describe("Pact Event Bot Error tests", () => {

  beforeEach(()=> {
    process.env = {
      SERVICE_NAME: "TEST_SERVICE",
      SLACK_TOKEN: "validSlackToken",
      SLACK_SIGNING_TOKEN: "validSlackSigningToken",
    };
  }) 
  
  it("should raise an error if we do not receive any event", async () => {
    // Arrange
    const event: Partial<APIGatewayEvent> = {};

    // Act
    const response = await handler(event as APIGatewayEvent, context);

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual(
      JSON.stringify({ errors: ["Cannot process request"] })
    );
  });

  it("should raise a forbidden error if we are passed the wrong credentials", async () => {
    // Arrange
    const event: Partial<APIGatewayEvent> = {
      body: JSON.stringify({
        token: "invalidSlackSigningToken",
      }),
    };

    // Act
    const response = await handler(event as APIGatewayEvent, context);

    expect(response.statusCode).toEqual(403);
    expect(response.body).toEqual(
      JSON.stringify({ message: "Access Denied" })
    );
  });

  it("should return a challenge, if present in the event", async () => {
    // Arrange
    const challenge = "testChallenge";
    const event: Partial<APIGatewayEvent> = {
      body: JSON.stringify({
        token: "validSlackSigningToken",
        challenge,
      }),
    };

    // Act
    const response = await handler(event as APIGatewayEvent, context);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(JSON.stringify(challenge));
  });

  it("should return not found, for a slack event that is not configured", async () => {
    // Arrange
    const slackEvent = "unconfiguredSlackEvent";
    const event: Partial<APIGatewayEvent> = {
      body: JSON.stringify({
        token: "validSlackSigningToken",
        event: {
          type: slackEvent,
        },
      }),
    };

    // Act
    const response = await handler(event as APIGatewayEvent, context);

    expect(response.statusCode).toEqual(200);
  });

  it("sends a message to slack for a team_join event", async () => {
    // Arrange
    const slackEvent = "team_join";
    const event: Partial<APIGatewayEvent> = {
      body: JSON.stringify({
        token: "validSlackSigningToken",
        event: {
          type: slackEvent,
          channel: "channel",
          // data: {
            user: {
              id: "id",
              real_name: "real_name",
            },
          // },
        },
      }),
    };

    // Act
    const response = await handler(event as APIGatewayEvent, context);

    // Assert
    expect(response.statusCode).toEqual(200);
  });

  it("should do something for a member_joined_channel event", async () => {
    // Arrange

    const slackEvent = "member_joined_channel";
    const event: Partial<APIGatewayEvent> = {
      body: JSON.stringify({
        token: "validSlackSigningToken",
        event: {
          type: slackEvent,
          channel: "channel",
          user: "id",
        },
      }),
    };

    // Act
    const response = await handler(event as APIGatewayEvent, context);

    // Assert
    expect(response.statusCode).toEqual(200);
  });

  it("should return a bad request if posting to slack returns an error", async () => {
    // Arrange
    const slackEvent = "team_join";
    const event: Partial<APIGatewayEvent> = {
      body: JSON.stringify({
        token: "validSlackSigningToken",
        event: {
          type: slackEvent,
          channel: "channel",
          data: {
            user: {
              id: "id",
              real_name: "real_name",
            },
          },
        },
      }),
    };

    mockpostEphemeral = jest.fn().mockResolvedValue({ ok: false });

    // Act
    const response = await handler(event as APIGatewayEvent, context);

    // Assert
    expect(response.statusCode).toEqual(500);
  });

  it("should return an internal server error if posting to slack fails", async () => {
    // Arrange
    const slackEvent = "team_join";
    const event: Partial<APIGatewayEvent> = {
      body: JSON.stringify({
        token: "validSlackSigningToken",
        event: {
          type: slackEvent,
          channel: "channel",
          data: {
            user: {
              id: "id",
              real_name: "real_name",
            },
          },
        },
      }),
    };

    mockpostEphemeral = jest.fn().mockRejectedValueOnce({});

    // Act
    const response = await handler(event as APIGatewayEvent, context);

    // Assert
    expect(response.statusCode).toEqual(500);
  });
});
