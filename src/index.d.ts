import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from "aws-lambda";

export type AsyncAPIGatewayProxyHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;
