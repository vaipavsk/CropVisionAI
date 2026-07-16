from __future__ import annotations

import logging
from pathlib import Path
from typing import Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class PreprocessingError(Exception):
    """Base exception for all image preprocessing errors."""
    pass


class ImageNotFoundError(PreprocessingError, FileNotFoundError):
    """Exception raised when the image file is not found on disk."""
    pass


class InvalidImageError(PreprocessingError, ValueError):
    """Exception raised when the image file is invalid, corrupted, or empty."""
    pass


class ImagePreprocessor:
    """Provides utility methods for loading, validating, and preprocessing crop images

    for machine learning inference (YOLO/EfficientNet).
    """

    def __init__(
        self,
        target_size: Tuple[int, int] = (224, 224),
        normalize: bool = True,
        mean: Tuple[float, float, float] | None = None,
        std: Tuple[float, float, float] | None = None,
        to_tensor_shape: bool = False,
    ) -> None:
        """Initialize the ImagePreprocessor.

        Args:
            target_size: Target size as a tuple of (height, width).
            normalize: Whether to scale pixel values to the range [0.0, 1.0].
            mean: Optional normalization mean for channel-wise scaling (e.g., ImageNet mean).
            std: Optional normalization standard deviation for channel-wise scaling.
            to_tensor_shape: If True, transpose array to PyTorch channel-first format (C, H, W).
                             If False, keep channel-last format (H, W, C).
        """
        self.target_size = target_size
        self.normalize = normalize
        self.mean = mean
        self.std = std
        self.to_tensor_shape = to_tensor_shape

    def load_and_validate(self, image_path: str | Path) -> np.ndarray:
        """Load an image from disk using OpenCV and perform validation checks.

        Args:
            image_path: Path to the image file.

        Returns:
            np.ndarray: Loaded image in BGR format.

        Raises:
            ImageNotFoundError: If the image file does not exist.
            InvalidImageError: If the image file cannot be read, has invalid dimensions,
                               or is corrupted.
        """
        path = Path(image_path)
        if not path.exists() or not path.is_file():
            logger.error(f"Image file not found: {path}")
            raise ImageNotFoundError(f"Image file not found: {path}")

        try:
            # cv2.imread returns None if the image cannot be decoded/is corrupted
            image = cv2.imread(str(path))
        except Exception as exc:
            logger.exception(f"Unexpected error reading image: {path}")
            raise InvalidImageError(f"Failed to read image due to system/OpenCV error: {path}") from exc

        if image is None:
            logger.error(f"Failed to decode image (corrupt or invalid format): {path}")
            raise InvalidImageError(f"Failed to decode image. File may be corrupted or invalid: {path}")

        height, width, channels = image.shape
        if height == 0 or width == 0:
            logger.error(f"Invalid image dimensions: {width}x{height} for {path}")
            raise InvalidImageError(f"Image has invalid dimensions: {width}x{height} for {path}")

        logger.info(f"Successfully loaded image {path.name} with shape {image.shape}")
        return image

    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """Preprocess the image by resizing, color conversion, normalization, and reshaping.

        Args:
            image: Input image array in BGR format (height, width, channels).

        Returns:
            np.ndarray: Preprocessed image array.
        """
        # 1. Convert grayscale to BGR if input has 2 dimensions
        if len(image.shape) == 2:
            logger.debug("Converting grayscale input to BGR")
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

        # 2. Resize image
        # cv2.resize expects (width, height)
        target_h, target_w = self.target_size
        if image.shape[:2] != (target_h, target_w):
            logger.debug(f"Resizing image from {image.shape[:2]} to {(target_h, target_w)}")
            image = cv2.resize(image, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

        # 3. Convert color space BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # 4. Convert to float32 for normalization / scaling
        processed = image_rgb.astype(np.float32)

        # 5. Normalize
        if self.normalize:
            processed /= 255.0

            if self.mean is not None and self.std is not None:
                mean_arr = np.array(self.mean, dtype=np.float32)
                std_arr = np.array(self.std, dtype=np.float32)
                processed = (processed - mean_arr) / std_arr

        # 6. Reorder dimensions to (C, H, W) if requested
        if self.to_tensor_shape:
            processed = np.transpose(processed, (2, 0, 1))

        return processed
