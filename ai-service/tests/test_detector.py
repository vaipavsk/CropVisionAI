from __future__ import annotations

import logging
import os
import sys
import unittest
from pathlib import Path

# Add the project root to the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ai import (
    DetectorImageNotFoundError,
    InferenceError,
    ModelLoadError,
    YOLODetector,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_detector")


class TestYOLODetector(unittest.TestCase):
    """Test suite for validating the YOLODetector component."""

    def setUp(self) -> None:
        self.upload_dir = PROJECT_ROOT / "app" / "uploads"
        self.image_paths = list(self.upload_dir.glob("*"))

    def test_detector_with_valid_image(self) -> None:
        """Test YOLO inference on a valid image from uploads."""
        valid_extensions = {".jpg", ".jpeg", ".png"}
        valid_files = [
            p for p in self.image_paths
            if p.suffix.lower() in valid_extensions and p.stat().st_size > 1024
        ]

        if not valid_files:
            self.skipTest("No valid images (>1KB) found in app/uploads to test.")

        # Test with the first valid image
        image_path = valid_files[0]
        logger.info(f"Running detection test on: {image_path.name}")

        try:
            detector = YOLODetector()
        except ModelLoadError as exc:
            self.fail(f"YOLODetector failed to initialize with default settings: {exc}")

        # Run detection
        try:
            detections = detector.detect(image_path)
        except Exception as exc:
            self.fail(f"Detector failed during inference on {image_path.name}: {exc}")

        self.assertIsInstance(detections, list)
        logger.info(f"Detection results for {image_path.name}: {detections}")

        for det in detections:
            self.assertIn("class_id", det)
            self.assertIn("class_name", det)
            self.assertIn("confidence", det)
            self.assertIn("bounding_box", det)

            self.assertIsInstance(det["class_id"], int)
            self.assertIsInstance(det["class_name"], str)
            self.assertIsInstance(det["confidence"], float)
            self.assertIsInstance(det["bounding_box"], tuple)
            self.assertEqual(len(det["bounding_box"]), 4)

            for coord in det["bounding_box"]:
                self.assertIsInstance(coord, float)

    def test_detector_with_nonexistent_image(self) -> None:
        """Test that passing a non-existent image raises DetectorImageNotFoundError."""
        detector = YOLODetector()
        nonexistent_image = PROJECT_ROOT / "app" / "uploads" / "nonexistent_crop_image.jpg"
        with self.assertRaises(DetectorImageNotFoundError):
            detector.detect(nonexistent_image)

    def test_detector_with_nonexistent_model(self) -> None:
        """Test that passing a non-existent model path raises ModelLoadError."""
        invalid_model_path = PROJECT_ROOT / "trained_models" / "nonexistent_model.pt"
        with self.assertRaises(ModelLoadError):
            YOLODetector(model_path=invalid_model_path)


if __name__ == "__main__":
    unittest.main()
