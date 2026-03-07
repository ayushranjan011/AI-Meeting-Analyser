const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: process.env.ENV_FILE || path.resolve(process.cwd(), ".env"),
});

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 4000),
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:5000",
  mongoUri: process.env.MONGO_URI || "",
  requestTimeoutMs: toNumber(process.env.REQUEST_TIMEOUT_MS, 60000),
  maxUploadMb: toNumber(process.env.MAX_UPLOAD_MB, 5),
  defaultSessionId: process.env.DEFAULT_SESSION_ID || "default-session",
};
