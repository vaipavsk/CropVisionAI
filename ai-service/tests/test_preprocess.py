from __future__ import annotations

import logging
import os
import sys
import unittest
from pathlib import Path

# Add the project root to the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ai.preprocess import (
    ImageNotFoundError,
    ImagePreprocessor,
    InvalidImageError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_preprocess")


class TestImagePreprocessor(unittest.TestCase):
    """Test suite for validating the ImagePreprocessor component."""

    def setUp(self) -> None:
        self.upload_dir = PROJECT_ROOT / "app" / "uploads"
        # Gather images from the upload directory
        self.image_paths = list(self.upload_dir.glob("*"))
        logger.info(f"Discovered {len(self.image_paths)} files in {self.upload_dir}")

    def test_preprocessor_with_valid_images(self) -> None:
        """Test preprocessing on actual valid images found in app/uploads."""
        valid_extensions = {".jpg", ".jpeg", ".png"}
        # Find images that are not tiny placeholder files (i.e. size > 1KB)
        valid_files = [
            p for p in self.image_paths
            if p.suffix.lower() in valid_extensions and p.stat().st_size > 1024
        ]

        if not valid_files:
            self.skipTest("No valid images (>1KB) found in app/uploads to test.")

        logger.info(f"Testing with {len(valid_files)} valid images: {[f.name for f in valid_files]}")

        # Instantiate preprocessors with different configurations
        preprocessor_default = ImagePreprocessor(target_size=(224, 224), to_tensor_shape=False)
        preprocessor_tensor = ImagePreprocessor(target_size=(128, 256), to_tensor_shape=True)
        preprocessor_normalized = ImagePreprocessor(
            target_size=(224, 224),
            mean=(0.485, 0.456, 0.406),
            std=(0.229, 0.224, 0.225),
        )

        for path in valid_files:
            with self.subTest(image_name=path.name):
                # 1. Load and validate
                img = preprocessor_default.load_and_validate(path)
                self.assertIsNotNone(img)
                self.assertEqual(len(img.shape), 3)
                self.assertEqual(img.shape[2], 3)  # BGR channel format

                # 2. Default preprocess (H, W, C), scaled [0.0, 1.0]
                out_default = preprocessor_default.preprocess(img)
                self.assertEqual(out_default.shape, (224, 224, 3))
                self.assertEqual(out_default.dtype, "float32")
                self.assertTrue(0.0 <= out_default.min() <= 1.0)
                self.assertTrue(0.0 <= out_default.max() <= 1.0)

                # 3. Tensor preprocess (C, H, W), scaled [0.0, 1.0]
                out_tensor = preprocessor_tensor.preprocess(img)
                self.assertEqual(out_tensor.shape, (3, 128, 256))
                self.assertEqual(out_tensor.dtype, "float32")
                self.assertTrue(0.0 <= out_tensor.min() <= 1.0)
                self.assertTrue(0.0 <= out_tensor.max() <= 1.0)

                # 4. Standard normalization with mean & std
                out_norm = preprocessor_normalized.preprocess(img)
                self.assertEqual(out_norm.shape, (224, 224, 3))
                # Normalized values should go outside [0, 1] due to mean/std shift
                logger.info(
                    f"File {path.name}: norm min={out_norm.min():.4f}, max={out_norm.max():.4f}"
                )

    def test_preprocessor_with_invalid_images(self) -> None:
        """Test preprocessing on dummy/corrupted files (e.g. 24 bytes) in app/uploads."""
        # Find files that are extremely small (e.g. < 500 bytes) which cannot be valid images
        invalid_files = [p for p in self.image_paths if p.stat().st_size < 500]

        if not invalid_files:
            self.skipTest("No small invalid files found in app/uploads to test.")

        logger.info(f"Testing error handling with {len(invalid_files)} invalid files: {[f.name for f in invalid_files]}")

        preprocessor = ImagePreprocessor()
        for path in invalid_files:
            with self.subTest(file_name=path.name):
                with self.assertRaises(InvalidImageError):
                    preprocessor.load_and_validate(path)

    def test_nonexistent_file_raises_error(self) -> None:
        """Test that a nonexistent path raises ImageNotFoundError."""
        preprocessor = ImagePreprocessor()
        nonexistent_path = PROJECT_ROOT / "app" / "uploads" / "does_not_exist_12345.jpg"
        with self.assertRaises(ImageNotFoundError):
            preprocessor.load_and_validate(nonexistent_path)


if __name__ == "__main__":
    unittest.main()
