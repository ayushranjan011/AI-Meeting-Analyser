import cv2

try:
    from fer import FER
except ImportError:
    from fer.fer import FER


class FerEmotionDetector:
    def __init__(self, use_mtcnn=True, max_width=640):
        self._detector = FER(mtcnn=use_mtcnn)
        self._max_width = max_width

    def _resize_for_inference(self, frame):
        height, width = frame.shape[:2]
        if width <= self._max_width:
            return frame, 1.0

        scale = self._max_width / float(width)
        resized = cv2.resize(frame, (int(width * scale), int(height * scale)))
        return resized, scale

    def detect(self, frame):
        resized_frame, scale = self._resize_for_inference(frame)
        raw_results = self._detector.detect_emotions(resized_frame)
        inverse_scale = 1.0 / scale

        faces = []
        for result in raw_results:
            x, y, w, h = result.get("box", [0, 0, 0, 0])
            emotions = result.get("emotions", {})
            if not emotions:
                continue

            emotion = max(emotions, key=emotions.get)
            confidence = float(emotions[emotion])

            faces.append(
                {
                    "box": {
                        "x": int(x * inverse_scale),
                        "y": int(y * inverse_scale),
                        "w": int(w * inverse_scale),
                        "h": int(h * inverse_scale),
                    },
                    "emotion": emotion.lower(),
                    "confidence": confidence,
                    "emotions": {name.lower(): float(score) for name, score in emotions.items()},
                }
            )

        return faces
