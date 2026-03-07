const mongoose = require("mongoose");

const FaceSchema = new mongoose.Schema(
  {
    emotion: { type: String, required: true },
    confidence: { type: Number, required: true },
    emotions: { type: Object, default: {} },
    box: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      w: { type: Number, required: true },
      h: { type: Number, required: true },
    },
  },
  { _id: false }
);

const EmotionEventSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    ts: { type: Date, required: true, default: Date.now, index: true },
    faces: { type: [FaceSchema], default: [] },
    dominantEmotion: { type: String, default: "neutral" },
    engagementScore: { type: Number, default: 0 },
    inferenceMs: { type: Number, default: 0 },
  },
  { versionKey: false }
);

EmotionEventSchema.index({ sessionId: 1, ts: 1 });

module.exports = mongoose.model("EmotionEvent", EmotionEventSchema);
