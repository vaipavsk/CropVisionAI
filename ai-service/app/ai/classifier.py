from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import torch
from PIL import Image
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

from app.config import get_settings

logger = logging.getLogger(__name__)


class ClassifierError(Exception):
    """Base exception for all classifier-related errors."""
    pass


class ModelLoadError(ClassifierError):
    """Exception raised when the EfficientNet model or weights fail to load."""
    pass


class InferenceError(ClassifierError):
    """Exception raised when EfficientNet inference fails."""
    pass


class EfficientNetClassifier:
    """Classifies crop damage or crop categories using an EfficientNet-B0 model."""

    def __init__(
        self,
        weights_path: str | Path | None = None,
        categories: List[str] | None = None,
    ) -> None:
        """Initialize the EfficientNet classifier.

        Args:
            weights_path: Optional path to local model weights (.pth file). If not provided,
                          the path configured in get_settings() is checked. If that is also None,
                          default pretrained ImageNet weights are downloaded/loaded.
            categories: Optional list of class label names corresponding to the output neurons.
                        If using standard ImageNet weights, default ImageNet category labels are loaded.

        Raises:
            ModelLoadError: If the model architecture cannot be set up or the weights fail to load.
        """
        # Resolve weights path
        if weights_path is None:
            settings = get_settings()
            self.weights_path = settings.efficientnet_weights_absolute_path
        else:
            self.weights_path = Path(weights_path)

        # Set evaluation mode
        self.model = None

        if self.weights_path is None:
            # Load default torchvision ImageNet pretrained weights
            try:
                logger.info("Loading default pretrained EfficientNet-B0 ImageNet weights")
                weights = EfficientNet_B0_Weights.DEFAULT
                self.model = efficientnet_b0(weights=weights)
                self.transforms = weights.transforms()
                self.categories = categories if categories is not None else weights.meta["categories"]
            except Exception as exc:
                logger.exception("Failed to initialize default EfficientNet-B0 model")
                raise ModelLoadError("Failed to initialize default EfficientNet-B0 model") from exc
        else:
            # Load custom model weights
            if not self.weights_path.exists():
                logger.error(f"Custom weights file not found at: {self.weights_path}")
                raise ModelLoadError(f"Custom weights file not found at: {self.weights_path}")

            try:
                logger.info(f"Loading custom EfficientNet-B0 weights from {self.weights_path}")
                num_classes = len(categories) if categories is not None else 1000
                
                # Construct empty architecture
                self.model = efficientnet_b0(weights=None)
                if num_classes != 1000:
                    logger.info(f"Modifying final classifier layer to output {num_classes} classes")
                    self.model.classifier[1] = torch.nn.Linear(
                        self.model.classifier[1].in_features, num_classes
                    )

                # Load weight state dict
                state_dict = torch.load(self.weights_path, map_location="cpu")
                self.model.load_state_dict(state_dict)

                # Fallback to official default transforms for shape preprocessing
                self.transforms = EfficientNet_B0_Weights.DEFAULT.transforms()
                self.categories = categories if categories is not None else [f"class_{i}" for i in range(num_classes)]
            except Exception as exc:
                logger.exception(f"Failed to load custom weights from {self.weights_path}")
                raise ModelLoadError(f"Failed to initialize custom EfficientNet-B0 model from {self.weights_path}") from exc

        # Set model to evaluation mode
        self.model.eval()

    def classify(self, image: np.ndarray) -> Dict[str, Any]:
        """Perform classification inference on a cropped RGB image.

        Args:
            image: Cropped RGB image as a NumPy array of shape (H, W, C).

        Returns:
            Dict[str, Any]: Classification outcome:
                {
                    "class_index": int,
                    "class_name": str,
                    "confidence": float
                }

        Raises:
            ClassifierError: If input validation checks fail.
            InferenceError: If forward pass or tensor preprocessing fails.
        """
        # Validate input shape and type
        if not isinstance(image, np.ndarray):
            logger.error("Classifier input is not a numpy array.")
            raise ClassifierError("Input image must be a numpy ndarray.")

        if len(image.shape) != 3 or image.shape[2] != 3:
            logger.error(f"Classifier input image shape is invalid. Expected (H, W, 3), got {image.shape}")
            raise ClassifierError(f"Input image must have shape (H, W, 3), got {image.shape}")

        if image.size == 0 or image.shape[0] == 0 or image.shape[1] == 0:
            logger.error(f"Classifier input image has zero dimension: {image.shape}")
            raise ClassifierError(f"Input image cannot have zero dimensions: {image.shape}")

        # Safely convert numpy array to a uint8 PIL Image for transforms
        try:
            if np.issubdtype(image.dtype, np.floating):
                if image.max() <= 1.0:
                    image_uint8 = (image * 255.0).astype(np.uint8)
                else:
                    image_uint8 = image.astype(np.uint8)
            else:
                image_uint8 = image.astype(np.uint8)

            pil_img = Image.fromarray(image_uint8)
        except Exception as exc:
            logger.exception("Failed to convert image array to PIL format")
            raise ClassifierError("Failed to convert numpy array to PIL Image") from exc

        # Run torchvision preprocessing transforms
        try:
            input_tensor = self.transforms(pil_img).unsqueeze(0)  # Add batch dim -> (1, C, H, W)
        except Exception as exc:
            logger.exception("Failed to apply pre-inference transformations")
            raise InferenceError("Preprocessing transforms failed") from exc

        # Run PyTorch inference
        try:
            logger.debug("Running EfficientNet classifier inference")
            with torch.no_grad():
                outputs = self.model(input_tensor)
                # Compute probabilities using Softmax over classes
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                confidence, class_idx = torch.max(probabilities, dim=0)
                
                class_idx_val = int(class_idx.item())
                confidence_val = float(confidence.item())
        except Exception as exc:
            logger.exception("EfficientNet forward pass failed")
            raise InferenceError("Model forward pass inference execution failed") from exc

        # Map target class label
        if class_idx_val < 0 or class_idx_val >= len(self.categories):
            logger.warning(f"Predicted class index {class_idx_val} is out of categories list range")
            class_name = f"unknown_class_{class_idx_val}"
        else:
            class_name = str(self.categories[class_idx_val])

        logger.info(f"Classification completed: index={class_idx_val}, class={class_name}, confidence={confidence_val:.4f}")
        return {
            "class_index": class_idx_val,
            "class_name": class_name,
            "confidence": confidence_val,
        }
