export const getEnv = (name: string) => {
  const value = process.env[name];

  if (!value || value === "undefined") {
    throw new Error(`Could not get environment variable: ${name}`);
  }

  return value;
};
