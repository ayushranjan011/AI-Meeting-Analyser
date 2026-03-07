import { useEffect, useRef } from "react";

function FaceOverlay({ videoRef, faces }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    const canvas = canvasRef.current;
    if (!videoEl || !canvas) {
      return;
    }

    const draw = () => {
      const rect = videoEl.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      canvas.width = rect.width;
      canvas.height = rect.height;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 2;
      context.strokeStyle = "#00e676";
      context.fillStyle = "#00e676";
      context.font = "600 14px Arial";

      const scaleX = rect.width / (videoEl.videoWidth || rect.width);
      const scaleY = rect.height / (videoEl.videoHeight || rect.height);

      for (const face of faces) {
        const box = face.box || {};
        const x = (box.x || 0) * scaleX;
        const y = (box.y || 0) * scaleY;
        const w = (box.w || 0) * scaleX;
        const h = (box.h || 0) * scaleY;
        const emotionLabel = `${face.emotion || "unknown"} ${Math.round((face.confidence || 0) * 100)}%`;

        context.strokeRect(x, y, w, h);
        context.fillText(emotionLabel, x, Math.max(14, y - 6));
      }
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [faces, videoRef]);

  return <canvas ref={canvasRef} className="face-overlay" />;
}

export default FaceOverlay;
