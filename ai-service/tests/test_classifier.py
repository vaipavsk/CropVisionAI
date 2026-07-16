from __future__ import annotations

import logging
import sys
import unittest
from pathlib import Path

import numpy as np

# Add the project root to the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ai import (
    ClassifierError,
    ClassifierModelLoadError,
    EfficientNetClassifier,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_classifier")


class TestEfficientNetClassifier(unittest.TestCase):
    """Test suite for validating the EfficientNetClassifier component."""

    def test_classifier_with_default_weights(self) -> None:
        """Test classifier initialization and inference with default pretrained weights."""
        try:
            logger.info("Initializing classifier with default settings")
            classifier = EfficientNetClassifier()
        except ClassifierModelLoadError as exc:
            self.fail(f"Failed to load default EfficientNet weights: {exc}")

        # 1. Run inference on a valid mock RGB image (range 0 to 255)
        mock_image_uint8 = np.random.randint(0, 256, size=(150, 150, 3), dtype=np.uint8)
        try:
            result = classifier.classify(mock_image_uint8)
        except Exception as exc:
            self.fail(f"Classifier raised error on valid uint8 crop: {exc}")

        self.assertIsInstance(result, dict)
        self.assertIn("class_index", result)
        self.assertIn("class_name", result)
        self.assertIn("confidence", result)

        self.assertIsInstance(result["class_index"], int)
        self.assertIsInstance(result["class_name"], str)
        self.assertIsInstance(result["confidence"], float)
        self.assertTrue(0.0 <= result["confidence"] <= 1.0)

        logger.info(f"Uint8 image classification output: {result}")

        # 2. Run inference on a valid mock float32 image (range 0.0 to 1.0)
        mock_image_float = np.random.rand(100, 200, 3).astype(np.float32)
        try:
            result_float = classifier.classify(mock_image_float)
        except Exception as exc:
            self.fail(f"Classifier raised error on valid float32 crop: {exc}")

        self.assertIsInstance(result_float["class_index"], int)
        self.assertIsInstance(result_float["confidence"], float)
        self.assertTrue(0.0 <= result_float["confidence"] <= 1.0)

        logger.info(f"Float32 image classification output: {result_float}")

    def test_classifier_with_custom_categories(self) -> None:
        """Test classifier with custom classes list."""
        custom_categories = [f"damage_level_{i}" for i in range(1000)]
        classifier = EfficientNetClassifier(categories=custom_categories)
        
        mock_image = np.random.randint(0, 256, size=(100, 100, 3), dtype=np.uint8)
        result = classifier.classify(mock_image)
        
        self.assertTrue(result["class_name"].startswith("damage_level_"))

    def test_classifier_invalid_inputs(self) -> None:
        """Test that invalid images/types raise ClassifierError."""
        classifier = EfficientNetClassifier()

        # Grayscale mock image (missing channels dimension)
        invalid_shape_image = np.random.randint(0, 256, size=(224, 224), dtype=np.uint8)
        with self.assertRaises(ClassifierError):
            classifier.classify(invalid_shape_image)

        # 4-channel mock image (RGBA)
        invalid_channels_image = np.random.randint(0, 256, size=(224, 224, 4), dtype=np.uint8)
        with self.assertRaises(ClassifierError):
            classifier.classify(invalid_channels_image)

        # Zero dimension image
        zero_dim_image = np.random.randint(0, 256, size=(0, 224, 3), dtype=np.uint8)
        with self.assertRaises(ClassifierError):
            classifier.classify(zero_dim_image)

        # Non-ndarray input
        with self.assertRaises(ClassifierError):
            classifier.classify("Not an image")  # type: ignore[arg-type]

    def test_classifier_invalid_weights_path(self) -> None:
        """Test that loading a non-existent weights file path raises ClassifierModelLoadError."""
        nonexistent_weights = PROJECT_ROOT / "trained_models" / "nonexistent_efficientnet.pth"
        with self.assertRaises(ClassifierModelLoadError):
            EfficientNetClassifier(weights_path=nonexistent_weights)


if __name__ == "__main__":
    unittest.main()
