const TRACKED_EMOTIONS = ["happy", "neutral", "sad", "angry", "surprise", "fear", "disgust"];

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function initializeCounters() {
  return TRACKED_EMOTIONS.reduce((acc, emotion) => {
    acc[emotion] = 0;
    return acc;
  }, {});
}

function buildAnalytics(events, bucketSeconds) {
  const counters = initializeCounters();
  let totalFaces = 0;
  let engagementSum = 0;

  const bucketMap = new Map();

  for (const event of events) {
    const faces = Array.isArray(event.faces) ? event.faces : [];
    const tsDate = new Date(event.ts);
    const bucketMs = bucketSeconds * 1000;
    const bucketStartMs = Math.floor(tsDate.getTime() / bucketMs) * bucketMs;
    const bucketKey = String(bucketStartMs);

    if (!bucketMap.has(bucketKey)) {
      const empty = initializeCounters();
      bucketMap.set(bucketKey, {
        ts: new Date(bucketStartMs).toISOString(),
        ...empty,
        totalFaces: 0,
        engagementSum: 0,
        frames: 0,
      });
    }

    const bucket = bucketMap.get(bucketKey);
    bucket.frames += 1;
    bucket.engagementSum += Number(event.engagementScore || 0);

    engagementSum += Number(event.engagementScore || 0);

    for (const face of faces) {
      const emotion = String(face.emotion || "").toLowerCase();
      if (Object.prototype.hasOwnProperty.call(counters, emotion)) {
        counters[emotion] += 1;
        bucket[emotion] += 1;
      }
      totalFaces += 1;
      bucket.totalFaces += 1;
    }
  }

  const distribution = Object.entries(counters).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: totalFaces > 0 ? round((count / totalFaces) * 100, 1) : 0,
  }));

  distribution.sort((a, b) => b.count - a.count);

  const dominantEmotion = distribution[0]?.count > 0 ? distribution[0].emotion : "neutral";
  const engagementScore = events.length > 0 ? round(engagementSum / events.length, 1) : 0;

  const timeline = [...bucketMap.values()]
    .sort((a, b) => new Date(a.ts) - new Date(b.ts))
    .map((bucket) => {
      const total = bucket.totalFaces || 1;
      const point = {
        ts: bucket.ts,
        engagement: round(bucket.engagementSum / Math.max(bucket.frames, 1), 1),
      };

      for (const emotion of TRACKED_EMOTIONS) {
        point[emotion] = round((bucket[emotion] / total) * 100, 1);
      }

      return point;
    });

  return {
    trackedEmotions: TRACKED_EMOTIONS,
    totalFrames: events.length,
    totalFaces,
    dominantEmotion,
    engagementScore,
    distribution,
    timeline,
    latestEvent: events.length > 0 ? events[events.length - 1] : null,
  };
}

module.exports = {
  TRACKED_EMOTIONS,
  buildAnalytics,
};
