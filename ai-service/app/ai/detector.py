from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple

try:
    from ultralytics import YOLO
except ImportError:
    # Safe fallback if loaded in environment without ultralytics during syntax checks
    YOLO = None

from app.config import get_settings

logger = logging.getLogger(__name__)


class DetectorError(Exception):
    """Base exception for all detector-related errors."""
    pass


class ModelLoadError(DetectorError):
    """Exception raised when the YOLO model cannot be loaded."""
    pass


class ImageNotFoundError(DetectorError, FileNotFoundError):
    """Exception raised when the target image for detection is missing."""
    pass


class InferenceError(DetectorError):
    """Exception raised when YOLO model inference fails."""
    pass


class YOLODetector:
    """Handles object detection on crop images using a pretrained YOLOv8 model."""

    def __init__(self, model_path: str | Path | None = None) -> None:
        """Initialize the YOLO Detector and load the model.

        Args:
            model_path: Optional path to the YOLO model file. If not provided,
                        it will be loaded from the application configuration.

        Raises:
            ModelLoadError: If the model path does not exist or the model fails to load.
        """
        if YOLO is None:
            logger.error("Ultralytics library is not installed.")
            raise ModelLoadError("Ultralytics library is not installed. Please check your dependencies.")

        if model_path is None:
            settings = get_settings()
            self.model_path = settings.yolo_model_absolute_path
        else:
            self.model_path = Path(model_path)

        if not self.model_path.exists():
            logger.error(f"YOLO model file does not exist at: {self.model_path}")
            raise ModelLoadError(f"YOLO model file does not exist at: {self.model_path}")

        try:
            logger.info(f"Loading YOLO model from: {self.model_path}")
            self.model = YOLO(str(self.model_path))
        except Exception as exc:
            logger.exception(f"Failed to load YOLO model from: {self.model_path}")
            raise ModelLoadError(f"Failed to initialize YOLO model from {self.model_path}") from exc

    def detect(self, image_path: str | Path) -> List[Dict[str, Any]]:
        """Run object detection on the specified image file.

        Args:
            image_path: Path to the image file to run detection on.

        Returns:
            List[Dict[str, Any]]: List of structured detection records:
                [
                    {
                        "class_id": int,
                        "class_name": str,
                        "confidence": float,
                        "bounding_box": (x1, y1, x2, y2)
                    },
                    ...
                ]

        Raises:
            ImageNotFoundError: If the image path does not exist on disk.
            InferenceError: If the YOLO inference call fails.
        """
        path = Path(image_path)
        if not path.exists() or not path.is_file():
            logger.error(f"Detection target image not found: {path}")
            raise ImageNotFoundError(f"Detection target image not found: {path}")

        try:
            logger.info(f"Running YOLO inference on image: {path.name}")
            # Run inference. verbose=False disables verbose console print from ultralytics
            results = self.model(str(path), verbose=False)
        except Exception as exc:
            logger.exception(f"YOLO inference failed on: {path.name}")
            raise InferenceError(f"Failed to run YOLO inference on {path.name}") from exc

        detections: List[Dict[str, Any]] = []
        if not results:
            return detections

        # Typically, a single image input returns a list containing one Result object
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                try:
                    # Extract coordinates as a list of float: [x1, y1, x2, y2]
                    xyxy = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    cls_name = str(result.names[cls_id])

                    detections.append({
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": conf,
                        "bounding_box": (xyxy[0], xyxy[1], xyxy[2], xyxy[3])
                    })
                except Exception as exc:
                    logger.warning(f"Skipping individual detection box parse due to unexpected layout: {exc}")
                    continue

        logger.info(f"YOLO inference completed successfully. Found {len(detections)} detection(s).")
        return detections
