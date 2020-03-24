import * as bunyan from "bunyan";

const noOutputLevel = bunyan.FATAL + 1; // One above the highest level - should produce no output

export const getMockLogger = () =>
  bunyan.createLogger({
    name: "pact-event-bot-logger",
    level: noOutputLevel
  });
