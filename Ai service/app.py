import os
import time
import threading
from datetime import datetime, timezone

from flask import Flask, jsonify, request

from utils.image import decode_uploaded_image

app = Flask(__name__)
_detector = None
_detector_lock = threading.Lock()


def _env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _build_detector():
    from detector.fer_detector import FerEmotionDetector

    use_mtcnn = _env_bool("AI_USE_MTCNN", True)
    max_width = int(os.getenv("AI_MAX_WIDTH", "640"))
    return FerEmotionDetector(use_mtcnn=use_mtcnn, max_width=max_width)


def get_detector():
    global _detector
    if _detector is None:
        with _detector_lock:
            if _detector is None:
                _detector = _build_detector()
    return _detector


@app.get("/health")
def health():
    return (
        jsonify(
            {
                "status": "ok",
                "service": "emotion-ai",
                "detectorInitialized": _detector is not None,
                "useMtcnn": _env_bool("AI_USE_MTCNN", True),
            }
        ),
        200,
    )


@app.post("/detect")
def detect():
    try:
        uploaded_file = request.files.get("frame")
        if uploaded_file is None:
            return jsonify({"error": "Missing image file in form-data key 'frame'."}), 400

        if uploaded_file.filename == "":
            return jsonify({"error": "Empty filename."}), 400

        start_time = time.perf_counter()
        frame = decode_uploaded_image(uploaded_file)
        detector = get_detector()
        faces = detector.detect(frame)
        inference_ms = int((time.perf_counter() - start_time) * 1000)

        return (
            jsonify(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "frame_size": {
                        "width": int(frame.shape[1]),
                        "height": int(frame.shape[0]),
                    },
                    "faces_detected": len(faces),
                    "faces": faces,
                    "inference_ms": inference_ms,
                }
            ),
            200,
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        return jsonify({"error": "Detection failed", "details": str(error)}), 500


if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", "5000"))
    debug = os.getenv("AI_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
