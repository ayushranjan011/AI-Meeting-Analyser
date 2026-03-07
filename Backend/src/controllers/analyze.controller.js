const { defaultSessionId } = require("../config/env");
const { detectFromBuffer } = require("../services/aiClient");
const { saveEvent } = require("../services/eventStore");

const ENGAGEMENT_WEIGHTS = {
  happy: 1.0,
  neutral: 0.7,
  surprise: 0.8,
  sad: 0.2,
  angry: 0.1,
  fear: 0.1,
  disgust: 0.05,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeFaces(aiResponse) {
  if (Array.isArray(aiResponse.faces)) {
    return aiResponse.faces.map((face) => ({
      box: {
        x: Number(face.box?.x || 0),
        y: Number(face.box?.y || 0),
        w: Number(face.box?.w || 0),
        h: Number(face.box?.h || 0),
      },
      emotion: String(face.emotion || "neutral").toLowerCase(),
      confidence: Number(face.confidence || 0),
      emotions: face.emotions || {},
    }));
  }

  if (Array.isArray(aiResponse.detections)) {
    return aiResponse.detections.map((item) => ({
      box: {
        x: Number(item.box?.x || 0),
        y: Number(item.box?.y || 0),
        w: Number(item.box?.w || 0),
        h: Number(item.box?.h || 0),
      },
      emotion: String(item.top_emotion || "neutral").toLowerCase(),
      confidence: Number(item.emotions?.[item.top_emotion] || 0),
      emotions: item.emotions || {},
    }));
  }

  return [];
}

function computeDominantEmotion(faces) {
  if (faces.length === 0) {
    return "neutral";
  }

  const counts = {};
  for (const face of faces) {
    counts[face.emotion] = (counts[face.emotion] || 0) + 1;
  }

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function computeEngagementScore(faces) {
  if (faces.length === 0) {
    return 0;
  }

  const weighted = faces.reduce((sum, face) => {
    const weight = ENGAGEMENT_WEIGHTS[face.emotion] ?? 0.5;
    const confidence = Number.isFinite(face.confidence) ? face.confidence : 0;
    return sum + weight * clamp(confidence, 0, 1);
  }, 0);

  return Math.round((weighted / faces.length) * 100);
}

async function analyzeFrame(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Missing image file in form-data key 'frame'." });
    }

    const aiResponse = await detectFromBuffer(req.file);
    const faces = normalizeFaces(aiResponse);
    const dominantEmotion = computeDominantEmotion(faces);
    const engagementScore = computeEngagementScore(faces);
    const sessionId = req.body.sessionId || req.query.sessionId || defaultSessionId;

    const event = {
      sessionId,
      ts: new Date(),
      faces,
      dominantEmotion,
      engagementScore,
      inferenceMs: Number(aiResponse.inference_ms || aiResponse.inferenceMs || 0),
    };

    await saveEvent(event);

    return res.status(200).json({
      sessionId,
      timestamp: event.ts.toISOString(),
      faces,
      facesDetected: faces.length,
      dominantEmotion,
      engagementScore,
      inferenceMs: event.inferenceMs,
    });
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        error: "AI service timeout",
        details: "Model warm-up can take up to 60 seconds on first request. Retry in a few moments.",
      });
    }

    if (error.code === "ECONNREFUSED") {
      return res.status(502).json({
        error: "AI service unreachable",
        details: "Ensure Python AI service is running on the configured AI_SERVICE_URL.",
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        error: "AI service returned an error.",
        details: error.response.data,
      });
    }

    return next(error);
  }
}

module.exports = {
  analyzeFrame,
};
