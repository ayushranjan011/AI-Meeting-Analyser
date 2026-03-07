const EmotionEvent = require("../models/EmotionEvent");
const { isDbConnected } = require("../config/db");

const MAX_MEMORY_EVENTS = 10000;
const memoryEvents = [];

async function saveEvent(event) {
  const normalized = {
    ...event,
    ts: event.ts ? new Date(event.ts) : new Date(),
  };

  if (isDbConnected()) {
    return EmotionEvent.create(normalized);
  }

  memoryEvents.push({
    ...normalized,
    _id: `${normalized.sessionId}-${normalized.ts.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
  });

  if (memoryEvents.length > MAX_MEMORY_EVENTS) {
    memoryEvents.splice(0, memoryEvents.length - MAX_MEMORY_EVENTS);
  }

  return normalized;
}

async function getEventsSince(sessionId, sinceDate) {
  const normalizedSince = sinceDate instanceof Date ? sinceDate : new Date(sinceDate);

  if (isDbConnected()) {
    return EmotionEvent.find({
      sessionId,
      ts: { $gte: normalizedSince },
    })
      .sort({ ts: 1 })
      .lean();
  }

  return memoryEvents
    .filter((event) => event.sessionId === sessionId && new Date(event.ts) >= normalizedSince)
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));
}

module.exports = {
  saveEvent,
  getEventsSince,
};
