import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";

export const setupTracing = () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    AWSXRay.captureHTTPsGlobal(http);
    AWSXRay.captureHTTPsGlobal(https);
  }
};