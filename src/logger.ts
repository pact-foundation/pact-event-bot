import { createLogger, DEBUG, INFO, stdSerializers } from "bunyan";
import { getEnv } from "./utils/getEnv";

interface LoggerOptions {
  name?: string;
}

export const getLogger = ({ name }: LoggerOptions) => {
  return createLogger({
    name: name || getEnv("SERVICE_NAME"),
    serializers: {
      err: stdSerializers.err,
      req: stdSerializers.req,
      res: stdSerializers.res
    },
    level: process.env.NODE_ENV === "production" ? INFO : DEBUG
  });
};
