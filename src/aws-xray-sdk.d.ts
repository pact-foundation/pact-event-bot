declare module "aws-xray-sdk" {
  export = awsXray;

  const awsXray: AWSXray;

  interface AWSXray {
    captureHTTPsGlobal: (mod: any) => void;
  }
}
