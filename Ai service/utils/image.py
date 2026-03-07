import cv2
import numpy as np


def decode_uploaded_image(uploaded_file):
    file_bytes = uploaded_file.read()
    if not file_bytes:
        raise ValueError("Empty file payload.")

    np_buffer = np.frombuffer(file_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Invalid image format.")

    return frame
