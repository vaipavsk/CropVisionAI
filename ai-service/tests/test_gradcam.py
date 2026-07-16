from __future__ import annotations

import logging
import sys
import unittest
from pathlib import Path

import numpy as np
import torch

# Add the project root to the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ai import (
    EfficientNetClassifier,
    GradCAMError,
    GradCAMGenerator,
    HeatmapGenerationError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_gradcam")


class TestGradCAMGenerator(unittest.TestCase):
    """Test suite for validating the GradCAMGenerator component."""

    def setUp(self) -> None:
        # Load the classifier once to reuse its model instance
        logger.info("Initializing EfficientNetClassifier to reuse its model")
        self.classifier = EfficientNetClassifier()
        self.generator = GradCAMGenerator()
        self.created_files: list[Path] = []

    def tearDown(self) -> None:
        # Clean up any files created during the test
        for path in self.created_files:
            if path.exists():
                try:
                    path.unlink()
                    logger.info(f"Cleaned up test file: {path.name}")
                except Exception as exc:
                    logger.warning(f"Failed to clean up test file {path}: {exc}")

    def test_heatmap_generation_success(self) -> None:
        """Test that Grad-CAM heatmap generates and saves successfully on a valid image."""
        mock_image = np.random.randint(0, 256, size=(120, 160, 3), dtype=np.uint8)

        # 1. Run classifier to get class index and confidence
        class_result = self.classifier.classify(mock_image)
        class_idx = class_result["class_index"]
        conf = class_result["confidence"]

        # 2. Run Grad-CAM generator
        try:
            result = self.generator.generate(
                model=self.classifier.model,
                image=mock_image,
                class_index=class_idx,
                confidence=conf,
                filename="test_heatmap_output.jpg",
            )
        except Exception as exc:
            self.fail(f"Grad-CAM generation raised unexpected exception: {exc}")

        # 3. Assert dictionary structure
        self.assertIsInstance(result, dict)
        self.assertIn("heatmap_path", result)
        self.assertIn("predicted_class", result)
        self.assertIn("confidence", result)

        self.assertEqual(result["predicted_class"], class_idx)
        self.assertEqual(result["confidence"], conf)

        # 4. Assert saved file exists and is non-empty
        saved_path = Path(result["heatmap_path"])
        self.created_files.append(saved_path)
        self.assertTrue(saved_path.exists())
        self.assertTrue(saved_path.is_file())
        self.assertGreater(saved_path.stat().st_size, 0)
        logger.info(f"Successfully generated and verified heatmap at: {saved_path}")

    def test_gradcam_invalid_inputs(self) -> None:
        """Test that passing invalid arguments raises appropriate exceptions."""
        mock_image = np.random.randint(0, 256, size=(100, 100, 3), dtype=np.uint8)

        # Invalid model type
        with self.assertRaises(GradCAMError):
            self.generator.generate(
                model="Not A Model",  # type: ignore[arg-type]
                image=mock_image,
                class_index=21,
            )

        # Invalid image rank (2D grayscale)
        invalid_shape_image = np.random.randint(0, 256, size=(100, 100), dtype=np.uint8)
        with self.assertRaises(GradCAMError):
            self.generator.generate(
                model=self.classifier.model,
                image=invalid_shape_image,
                class_index=21,
            )

        # Zero size image
        zero_size_image = np.random.randint(0, 256, size=(0, 100, 3), dtype=np.uint8)
        with self.assertRaises(GradCAMError):
            self.generator.generate(
                model=self.classifier.model,
                image=zero_size_image,
                class_index=21,
            )

        # Class index out of bounds
        with self.assertRaises(GradCAMError):
            self.generator.generate(
                model=self.classifier.model,
                image=mock_image,
                class_index=-5,
            )

        with self.assertRaises(GradCAMError):
            self.generator.generate(
                model=self.classifier.model,
                image=mock_image,
                class_index=50000,
            )


if __name__ == "__main__":
    unittest.main()
