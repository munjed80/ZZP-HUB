export const allowSensitiveAuthLogs = process.env.AUTH_DEBUG === "true";
export const shouldLogAuth =
  allowSensitiveAuthLogs || process.env.NODE_ENV !== "production";
