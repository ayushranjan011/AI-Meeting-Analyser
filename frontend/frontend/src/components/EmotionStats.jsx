import React from "react";

function toTitleCase(value) {
  if (!value) {
    return "N/A";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function MetricCard({ label, value, tone = "default" }) {
  return (
    <div className={`metric-card ${tone}`}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
    </div>
  );
}

function EmotionStats({ latestResult, analytics, isAnalyzing }) {
  const dominantEmotion = toTitleCase(analytics?.dominantEmotion || latestResult?.dominantEmotion || "neutral");
  const activeFaces = latestResult?.facesDetected ?? latestResult?.faces?.length ?? 0;
  const engagementScore = analytics?.engagementScore ?? latestResult?.engagementScore ?? 0;
  const inferenceMs = latestResult?.inferenceMs ?? 0;

  return (
    <section className="panel metrics-panel">
      <div className="panel-header">
        <h2>Live Metrics</h2>
      </div>
      <div className="metrics-grid">
        <MetricCard label="Active Faces" value={activeFaces} />
        <MetricCard label="Dominant Emotion" value={dominantEmotion} tone="emotion" />
        <MetricCard label="Engagement Score" value={`${engagementScore}%`} tone="engagement" />
        <MetricCard label="AI Latency" value={`${inferenceMs} ms`} tone={isAnalyzing ? "analyzing" : "default"} />
      </div>
    </section>
  );
}

export default EmotionStats;
