const { defaultSessionId } = require("../config/env");
const { getEventsSince } = require("../services/eventStore");
const { buildAnalytics } = require("../services/analyticsService");

function parseIntWithFallback(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

async function getLiveAnalytics(req, res, next) {
  try {
    const sessionId = req.query.sessionId || defaultSessionId;
    const minutes = parseIntWithFallback(req.query.minutes, 5, 1, 180);
    const bucketSeconds = parseIntWithFallback(req.query.bucketSeconds, 5, 1, 60);
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const events = await getEventsSince(sessionId, since);
    const analytics = buildAnalytics(events, bucketSeconds);

    return res.status(200).json({
      sessionId,
      windowMinutes: minutes,
      bucketSeconds,
      ...analytics,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getLiveAnalytics,
};
