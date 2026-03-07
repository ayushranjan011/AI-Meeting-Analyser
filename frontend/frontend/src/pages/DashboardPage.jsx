import React, { useMemo } from "react";
import WebcamStream from "../components/WebcamStream";
import FaceOverlay from "../components/FaceOverlay";
import EmotionStats from "../components/EmotionStats";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import useEmotionStream from "../hooks/useEmotionStream";
import useLiveAnalytics from "../hooks/useLiveAnalytics";

function buildSessionId() {
  if (window.crypto?.randomUUID) {
    return `session-${window.crypto.randomUUID()}`;
  }

  return `session-${Date.now()}`;
}

function DashboardPage() {
  const sessionId = useMemo(() => buildSessionId(), []);

  const { videoRef, latestResult, isCameraLoading, isAnalyzing, cameraError, streamError } = useEmotionStream({
    sessionId,
    captureIntervalMs: 400,
  });

  const { analytics, error: analyticsError } = useLiveAnalytics({
    sessionId,
    minutes: 5,
    bucketSeconds: 5,
    pollIntervalMs: 2500,
  });

  const activeFaces = latestResult?.facesDetected ?? latestResult?.faces?.length ?? 0;
  const engagementScore = analytics?.engagementScore ?? latestResult?.engagementScore ?? 0;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <h1>AI Emotion Analytics Dashboard</h1>
        <p className="session-label">
          Session: <code>{sessionId}</code>
        </p>
        <div className="header-pills">
          <span className={`pill ${isAnalyzing ? "live" : "idle"}`}>{isAnalyzing ? "Analyzing Live" : "Analyzer Idle"}</span>
          <span className="pill info">Faces: {activeFaces}</span>
          <span className="pill accent">Engagement: {Math.round(engagementScore)}%</span>
        </div>
      </header>

      {(streamError || analyticsError) && (
        <div className="global-error">
          {streamError && <p>Frame Stream Error: {streamError}</p>}
          {analyticsError && <p>Analytics Error: {analyticsError}</p>}
        </div>
      )}

      <div className="dashboard-grid">
        <section className="video-column">
          <WebcamStream videoRef={videoRef} isCameraLoading={isCameraLoading} cameraError={cameraError}>
            <FaceOverlay videoRef={videoRef} faces={latestResult.faces || []} />
          </WebcamStream>
          <section className="panel face-list-panel">
            <div className="panel-header">
              <h2>Detected Faces</h2>
            </div>
            {latestResult.faces?.length ? (
              <ul className="face-list">
                {latestResult.faces.map((face, index) => (
                  <li key={`${face.emotion}-${index}`}>
                    <strong>Face {index + 1}:</strong> {face.emotion} ({Math.round((face.confidence || 0) * 100)}%)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="status-text">No faces detected in current frame.</p>
            )}
          </section>
        </section>

        <section className="analytics-column">
          <EmotionStats latestResult={latestResult} analytics={analytics} isAnalyzing={isAnalyzing} />
          <AnalyticsDashboard analytics={analytics} />
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
