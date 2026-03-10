import cv2

try:
    from fer import FER
except ImportError:
    from fer.fer import FER


class FerEmotionDetector:
    def __init__(self, use_mtcnn=True, max_width=640, min_face_size=40):
        self._use_mtcnn = bool(use_mtcnn)
        self._primary_detector = FER(mtcnn=self._use_mtcnn, min_face_size=min_face_size)
        self._fallback_detector = FER(mtcnn=False, min_face_size=min_face_size) if self._use_mtcnn else None
        self._max_width = max_width

    def _resize_for_inference(self, frame):
        height, width = frame.shape[:2]
        if width <= self._max_width:
            return frame, 1.0

        scale = self._max_width / float(width)
        resized = cv2.resize(frame, (int(width * scale), int(height * scale)))
        return resized, scale

    @staticmethod
    def _detect_with(detector, frame):
        if detector is None:
            return []
        try:
            return detector.detect_emotions(frame)
        except Exception:
            return []

    def detect(self, frame):
        resized_frame, scale = self._resize_for_inference(frame)
        raw_results = self._detect_with(self._primary_detector, resized_frame)

        # MTCNN can miss some webcam frames depending on channel ordering.
        if not raw_results and self._use_mtcnn:
            rgb_frame = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2RGB)
            raw_results = self._detect_with(self._primary_detector, rgb_frame)

        # Fallback to Haar detector for better reliability on low-quality webcam frames.
        if not raw_results and self._fallback_detector is not None:
            raw_results = self._detect_with(self._fallback_detector, resized_frame)

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
