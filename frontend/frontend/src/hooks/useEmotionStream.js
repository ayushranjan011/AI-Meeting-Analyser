import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../api/client";

const DEFAULT_RESULT = {
  faces: [],
  facesDetected: 0,
  dominantEmotion: "neutral",
  engagementScore: 0,
  inferenceMs: 0,
  timestamp: null,
};

function normalizeStreamError(error) {
  const message = error?.message || "Frame analysis failed.";

  if (/network error/i.test(message)) {
    return "Backend API unreachable. Check karo ki backend (:4000) aur AI service (:5000) run ho rahe hain.";
  }

  return message;
}

export default function useEmotionStream({ sessionId, captureIntervalMs = 400 }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  const [isCameraLoading, setIsCameraLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [streamError, setStreamError] = useState("");
  const [latestResult, setLatestResult] = useState(DEFAULT_RESULT);

  const captureAndAnalyze = useCallback(async () => {
    if (inFlightRef.current || !videoRef.current) {
      return;
    }

    const videoEl = videoRef.current;
    if (videoEl.readyState < 2) {
      return;
    }

    inFlightRef.current = true;
    setIsAnalyzing(true);

    try {
      const canvas = canvasRef.current;
      const width = videoEl.videoWidth || 640;
      const height = videoEl.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to initialize capture canvas.");
      }

      context.drawImage(videoEl, 0, 0, width, height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.75);
      });

      if (!blob) {
        throw new Error("Unable to capture frame.");
      }

      const formData = new FormData();
      formData.append("frame", blob, "frame.jpg");
      formData.append("sessionId", sessionId);

      const { data } = await apiClient.post("/analyze-frame", formData);
      setLatestResult({
        ...DEFAULT_RESULT,
        ...data,
      });
      setStreamError("");
    } catch (error) {
      setStreamError(normalizeStreamError(error));
    } finally {
      inFlightRef.current = false;
      setIsAnalyzing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (isMounted) {
          setCameraError("This browser does not support webcam access.");
          setIsCameraLoading(false);
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 960 },
            height: { ideal: 540 },
            facingMode: "user",
          },
          audio: false,
        });

        if (!isMounted || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setCameraError("");
      } catch (error) {
        if (isMounted) {
          setCameraError(error.message || "Unable to access webcam.");
        }
      } finally {
        if (isMounted) {
          setIsCameraLoading(false);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (cameraError) {
      return;
    }

    timerRef.current = setInterval(() => {
      captureAndAnalyze();
    }, captureIntervalMs);

    captureAndAnalyze();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [captureAndAnalyze, captureIntervalMs, cameraError]);

  return {
    videoRef,
    latestResult,
    isCameraLoading,
    isAnalyzing,
    cameraError,
    streamError,
  };
}
