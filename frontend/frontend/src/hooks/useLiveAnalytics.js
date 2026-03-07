import { useEffect, useState } from "react";
import apiClient from "../api/client";

const DEFAULT_ANALYTICS = {
  trackedEmotions: ["happy", "neutral", "sad", "angry", "surprise", "fear", "disgust"],
  totalFrames: 0,
  totalFaces: 0,
  dominantEmotion: "neutral",
  engagementScore: 0,
  distribution: [],
  timeline: [],
  latestEvent: null,
};

export default function useLiveAnalytics({
  sessionId,
  minutes = 5,
  bucketSeconds = 5,
  pollIntervalMs = 2500,
}) {
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        const { data } = await apiClient.get("/analytics/live", {
          params: {
            sessionId,
            minutes,
            bucketSeconds,
          },
        });

        if (!isMounted) {
          return;
        }

        setAnalytics({
          ...DEFAULT_ANALYTICS,
          ...data,
        });
        setError("");
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || "Unable to fetch analytics.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAnalytics();
    const timer = setInterval(fetchAnalytics, pollIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [sessionId, minutes, bucketSeconds, pollIntervalMs]);

  return {
    analytics,
    error,
    isLoading,
  };
}
