const getNodeEnv = () => process.env.NODE_ENV || "development";

const isProduction = () => getNodeEnv() === "production";

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback = false) => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
};

const getAllowedOrigins = () =>
  (process.env.FRONTEND_ORIGIN ||
    "http://localhost:5173,http://localhost:5174,http://localhost:5184,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5184")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const validateEnvironment = () => {
  const missing = [];

  if (!process.env.MONGO_URI) missing.push("MONGO_URI");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");

  if (isProduction() && !process.env.FRONTEND_ORIGIN) {
    missing.push("FRONTEND_ORIGIN");
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

const getRuntimeConfig = () => ({
  nodeEnv: getNodeEnv(),
  isProduction: isProduction(),
  port: toInt(process.env.PORT, 5000),
  allowedOrigins: getAllowedOrigins(),
  enableRequestLogging: toBool(process.env.ENABLE_REQUEST_LOGGING, !isProduction()),
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMaxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 300),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "2mb",
});

module.exports = {
  validateEnvironment,
  getRuntimeConfig,
};
