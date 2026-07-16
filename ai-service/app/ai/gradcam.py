from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Any, Dict

import cv2
import numpy as np
import torch
from PIL import Image
from torchvision.models import EfficientNet_B0_Weights

from app.config import get_settings

logger = logging.getLogger(__name__)


class GradCAMError(Exception):
    """Base exception for all Grad-CAM-related errors."""
    pass


class HeatmapGenerationError(GradCAMError):
    """Exception raised when heatmap generation fails."""
    pass


class GradCAMGenerator:
    """Generates Gradient-weighted Class Activation Mapping (Grad-CAM) heatmaps

    for explainability of EfficientNet classification results.
    """

    def __init__(self) -> None:
        """Initialize the GradCAMGenerator."""
        pass

    def generate(
        self,
        model: torch.nn.Module,
        image: np.ndarray,
        class_index: int,
        confidence: float | None = None,
        filename: str | None = None,
    ) -> Dict[str, Any]:
        """Generate a Grad-CAM heatmap, overlay it on the input image, and save it.

        Args:
            model: Instantiated EfficientNet PyTorch model (evaluation mode).
            image: Original crop image in RGB format as a NumPy array (H, W, 3).
            class_index: Predicted/target class index for visualization.
            confidence: Optional confidence score for metadata storage.
            filename: Optional filename to save the heatmap. If not provided, a UUID is generated.

        Returns:
            Dict[str, Any]: Structured heatmap results:
                {
                    "heatmap_path": str,
                    "predicted_class": int,
                    "confidence": float | None
                }

        Raises:
            GradCAMError: For input image or model validation failures.
            HeatmapGenerationError: For hooks capture or mathematical generation failures.
        """
        # 1. Validate inputs
        if not isinstance(model, torch.nn.Module):
            logger.error("Input model is not a PyTorch Module.")
            raise GradCAMError("Model must be an instance of torch.nn.Module.")

        if not isinstance(image, np.ndarray):
            logger.error("Input image is not a numpy array.")
            raise GradCAMError("Input image must be a numpy ndarray.")

        if len(image.shape) != 3 or image.shape[2] != 3:
            logger.error(f"Input image shape is invalid. Expected (H, W, 3), got {image.shape}")
            raise GradCAMError(f"Input image must have shape (H, W, 3), got {image.shape}")

        if image.size == 0 or image.shape[0] == 0 or image.shape[1] == 0:
            logger.error(f"Input image has zero dimension: {image.shape}")
            raise GradCAMError(f"Input image cannot have zero dimensions: {image.shape}")

        # 2. Prepare PyTorch Input Tensor
        try:
            if np.issubdtype(image.dtype, np.floating):
                if image.max() <= 1.0:
                    image_uint8 = (image * 255.0).astype(np.uint8)
                else:
                    image_uint8 = image.astype(np.uint8)
            else:
                image_uint8 = image.astype(np.uint8)

            pil_img = Image.fromarray(image_uint8)
            transforms = EfficientNet_B0_Weights.DEFAULT.transforms()
            input_tensor = transforms(pil_img).unsqueeze(0)  # Shape -> (1, C, H, W)
        except Exception as exc:
            logger.exception("Failed to prepare input tensor for Grad-CAM analysis")
            raise GradCAMError("Failed to convert/preprocess image array") from exc

        # 3. Setup hooks to capture activations and gradients
        activations = []
        gradients = []

        def forward_hook(module: torch.nn.Module, input_args: Any, output_val: torch.Tensor) -> None:
            # Capture output features of target layer
            activations.append(output_val)

        def backward_hook(module: torch.nn.Module, grad_in: Any, grad_out: Tuple[torch.Tensor, ...]) -> None:
            # Capture gradients w.r.t target layer output
            gradients.append(grad_out[0])

        # Hook into the last convolutional feature block of EfficientNet-B0 (model.features[-1])
        try:
            target_layer = model.features[-1]
        except AttributeError as exc:
            logger.error("Model does not appear to be an EfficientNet structure with a features attribute.")
            raise GradCAMError("Grad-CAM target layer 'model.features' not found. Ensure EfficientNet structure.") from exc

        handle_forward = target_layer.register_forward_hook(forward_hook)
        handle_backward = target_layer.register_full_backward_hook(backward_hook)

        # 4. Backward Pass w.r.t Target Class
        try:
            logger.info(f"Running backpropagation for class index {class_index}")
            # Ensure gradients are enabled for this step
            with torch.enable_grad():
                outputs = model(input_tensor)
                
                # Check class index bounds
                num_classes = outputs.shape[1]
                if class_index < 0 or class_index >= num_classes:
                    raise GradCAMError(f"Target class index {class_index} is out of model output range (0-{num_classes-1}).")

                score = outputs[0, class_index]
                model.zero_grad()
                score.backward()
        except Exception as exc:
            logger.exception("Error executing model backward pass for class scores")
            raise HeatmapGenerationError("Failed to execute gradient backpropagation") from exc
        finally:
            # Crucial: clean up hooks to prevent memory leaks!
            handle_forward.remove()
            handle_backward.remove()

        # 5. Extract Activations and Gradients
        if not activations or not gradients:
            logger.error("Failed to capture activations or gradients from hooks.")
            raise HeatmapGenerationError("Grad-CAM hooks failed to record activations or gradients.")

        act = activations[0]  # Shape: (1, channels, H_feat, W_feat)
        grad = gradients[0]   # Shape: (1, channels, H_feat, W_feat)

        # 6. Compute CAM Heatmap
        try:
            # GAP (Global Average Pooling) over height and width of gradients to get channel weights
            weights = torch.mean(grad, dim=(2, 3), keepdim=True)  # Shape: (1, channels, 1, 1)

            # Weighted sum of feature activation maps
            cam = torch.sum(weights * act, dim=1)  # Shape: (1, H_feat, W_feat)
            cam = torch.relu(cam)                  # Focus only on positive influence

            # Convert to CPU numpy array
            cam = cam.squeeze(0).cpu().detach().numpy()

            # Min-Max Normalization
            cam_max = cam.max()
            if cam_max > 0:
                cam = cam / cam_max
        except Exception as exc:
            logger.exception("Failed to compute Grad-CAM mathematical weights")
            raise HeatmapGenerationError("Mathematical calculation of heatmap failed") from exc

        # 7. Post-process and Overlay Heatmap
        try:
            orig_h, orig_w = image.shape[:2]
            
            # Resize CAM to original image size
            heatmap_resized = cv2.resize(cam, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
            heatmap_uint8 = np.uint8(255 * heatmap_resized)

            # Colorize the heatmap using JET colormap
            colormap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
            colormap_rgb = cv2.cvtColor(colormap, cv2.COLOR_BGR2RGB)

            # Superimpose overlay: 60% original image + 40% colored heatmap
            overlay = cv2.addWeighted(image_uint8, 0.6, colormap_rgb, 0.4, 0)
        except Exception as exc:
            logger.exception("Failed to build heatmap image overlay")
            raise HeatmapGenerationError("Grad-CAM image overlay composition failed") from exc

        # 8. Save visualization image
        try:
            settings = get_settings()
            save_dir = settings.report_dir / "heatmaps"
            save_dir.mkdir(parents=True, exist_ok=True)

            if filename is None:
                filename = f"gradcam_{uuid.uuid4().hex}.jpg"
            
            save_path = save_dir / filename
            
            # Convert RGB back to BGR for OpenCV write
            overlay_bgr = cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR)
            cv2.imwrite(str(save_path), overlay_bgr)
            logger.info(f"Grad-CAM heatmap successfully saved to: {save_path}")
        except Exception as exc:
            logger.exception(f"Failed to save heatmap visualization file to disk")
            raise HeatmapGenerationError("Failed to save heatmap image to filesystem") from exc

        return {
            "heatmap_path": str(save_path),
            "predicted_class": class_index,
            "confidence": confidence,
        }
