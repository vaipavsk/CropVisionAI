from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

import cv2
import numpy as np
import torch
import torch.nn as nn
from PIL import Image

from app.config import get_settings

logger = logging.getLogger(__name__)


class SegmentationError(Exception):
    """Base exception for all segmentation-related errors."""
    pass


class SegmentationModelLoadError(SegmentationError):
    """Exception raised when the Small U-Net model or checkpoint weights fail to load."""
    pass


class SegmentationInferenceError(SegmentationError):
    """Exception raised when segmentation preprocessing or inference fails."""
    pass


class ConvBlock(nn.Module):
    """Double 3x3 convolution block with batch normalization and ReLU activations."""

    def __init__(self, in_c: int, out_c: int) -> None:
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_c, out_c, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_c),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_c, out_c, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_c),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class SmallUNet(nn.Module):
    """Small U-Net segmentation architecture matching the trained Colab PlantSeg checkpoint.

    Architecture parameters:
        in_channels: 3 (RGB)
        out_channels: 1 (Binary mask logit)
        base_channels: 16
    """

    def __init__(self, in_channels: int = 3, out_channels: int = 1, base_channels: int = 16) -> None:
        super().__init__()
        b = base_channels
        self.enc1 = ConvBlock(in_channels, b)
        self.pool1 = nn.MaxPool2d(2)
        self.enc2 = ConvBlock(b, b * 2)
        self.pool2 = nn.MaxPool2d(2)
        self.enc3 = ConvBlock(b * 2, b * 4)
        self.pool3 = nn.MaxPool2d(2)

        self.bottleneck = ConvBlock(b * 4, b * 8)

        self.up3 = nn.ConvTranspose2d(b * 8, b * 4, kernel_size=2, stride=2)
        self.dec3 = ConvBlock(b * 8, b * 4)
        self.up2 = nn.ConvTranspose2d(b * 4, b * 2, kernel_size=2, stride=2)
        self.dec2 = ConvBlock(b * 4, b * 2)
        self.up1 = nn.ConvTranspose2d(b * 2, b, kernel_size=2, stride=2)
        self.dec1 = ConvBlock(b * 2, b)

        self.final = nn.Conv2d(b, out_channels, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool1(e1))
        e3 = self.enc3(self.pool2(e2))
        b = self.bottleneck(self.pool3(e3))

        d3 = self.dec3(torch.cat([self.up3(b), e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))
        return self.final(d1)


_cached_segmentation_model: Optional[SmallUNet] = None


class PlantSegmentationModel:
    """Encapsulates the Small U-Net model loader and inference pipeline for experimental segmentation."""

    def __init__(
        self,
        weights_path: Optional[Union[str, Path]] = None,
        threshold: float = 0.5,
        device: Optional[str] = None,
    ) -> None:
        """Initialize the PlantSegmentationModel.

        Args:
            weights_path: Path to the small_unet_best_val.pth checkpoint.
            threshold: Probability threshold for binary mask discretization (default: 0.5).
            device: Computing device ('cpu' or 'cuda'). Defaults to 'cpu' for deterministic inference.
        """
        settings = get_settings()
        self.weights_path = Path(weights_path) if weights_path else settings.segmentation_weights_absolute_path
        self.threshold = threshold
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model = self._load_model()

    def _load_model(self) -> SmallUNet:
        """Load and cache the Small U-Net model with pretrained checkpoint weights."""
        global _cached_segmentation_model

        if not self.weights_path or not self.weights_path.is_file():
            raise SegmentationModelLoadError(
                f"Small U-Net checkpoint not found at: {self.weights_path}. "
                "Ensure small_unet_best_val.pth is present in the segmentation models directory."
            )

        settings = get_settings()
        if self.weights_path == settings.segmentation_weights_absolute_path and _cached_segmentation_model is not None:
            return _cached_segmentation_model

        try:
            model = SmallUNet(in_channels=3, out_channels=1, base_channels=16)
            checkpoint = torch.load(self.weights_path, map_location=self.device)

            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                state_dict = checkpoint["model_state_dict"]
            elif isinstance(checkpoint, dict):
                state_dict = checkpoint
            else:
                raise SegmentationModelLoadError("Unexpected checkpoint structure in segmentation weights.")

            model.load_state_dict(state_dict, strict=True)
            model.to(self.device)
            model.eval()

            _cached_segmentation_model = model
            logger.info(f"Loaded Small U-Net checkpoint from {self.weights_path} onto {self.device}")
            return model
        except Exception as exc:
            if isinstance(exc, SegmentationModelLoadError):
                raise
            raise SegmentationModelLoadError(f"Failed to load Small U-Net weights: {str(exc)}") from exc

    def preprocess_image(self, image: Union[Image.Image, np.ndarray, str, Path]) -> Tuple[torch.Tensor, np.ndarray]:
        """Preprocess an input image for Small U-Net inference.

        Prepares RGB tensor of shape [1, 3, 256, 256] with values scaled to [0.0, 1.0].

        Args:
            image: PIL Image, NumPy array (RGB or BGR), or file path.

        Returns:
            Tuple of (preprocessed tensor [1, 3, 256, 256], original RGB NumPy array).
        """
        try:
            if isinstance(image, (str, Path)):
                img_path = Path(image)
                if not img_path.is_file():
                    raise SegmentationInferenceError(f"Image file not found: {img_path}")
                pil_img = Image.open(img_path).convert("RGB")
            elif isinstance(image, np.ndarray):
                if image.ndim == 2:
                    pil_img = Image.fromarray(image).convert("RGB")
                elif image.ndim == 3:
                    pil_img = Image.fromarray(image)
                else:
                    raise SegmentationInferenceError(f"Invalid image array shape: {image.shape}")
            elif isinstance(image, Image.Image):
                pil_img = image.convert("RGB")
            else:
                raise SegmentationInferenceError(f"Unsupported image input type: {type(image)}")

            orig_np = np.array(pil_img)

            # Resize to 256x256 using bilinear interpolation
            resized = pil_img.resize((256, 256), Image.Resampling.BILINEAR)
            arr = np.array(resized, dtype=np.float32) / 255.0  # (256, 256, 3)

            # Transpose to (C, H, W) -> (3, 256, 256) and add batch dimension -> (1, 3, 256, 256)
            tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(self.device)
            return tensor, orig_np

        except Exception as exc:
            if isinstance(exc, SegmentationInferenceError):
                raise
            raise SegmentationInferenceError(f"Image preprocessing failed for segmentation: {str(exc)}") from exc

    def predict_mask(
        self,
        image: Union[Image.Image, np.ndarray, str, Path],
        threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Run segmentation inference and generate binary prediction mask and metrics.

        Args:
            image: Input image.
            threshold: Discretization threshold override.

        Returns:
            Dict containing:
                - probability_map: (256, 256) float array [0, 1]
                - binary_mask: (256, 256) uint8 array [0 or 255]
                - predicted_region_ratio: float [0.0, 1.0]
                - threshold: float
                - original_image_rgb: (H, W, 3) uint8 array
        """
        thresh = threshold if threshold is not None else self.threshold
        tensor, orig_rgb = self.preprocess_image(image)

        try:
            with torch.no_grad():
                logits = self.model(tensor)
                probs = torch.sigmoid(logits)

            prob_np = probs.squeeze().cpu().numpy()  # (256, 256)
            bin_mask = (prob_np > thresh).astype(np.uint8)  # 0 or 1

            total_pixels = bin_mask.size
            foreground_pixels = int(np.sum(bin_mask))
            predicted_ratio = float(foreground_pixels / total_pixels) if total_pixels > 0 else 0.0

            return {
                "probability_map": prob_np,
                "binary_mask": bin_mask * 255,  # scale to 0/255 for display
                "predicted_region_ratio": round(predicted_ratio, 4),
                "threshold": thresh,
                "original_image_rgb": orig_rgb,
            }
        except Exception as exc:
            raise SegmentationInferenceError(f"Segmentation inference failed: {str(exc)}") from exc

    def generate_and_save_artifacts(
        self,
        image: Union[Image.Image, np.ndarray, str, Path],
        output_dir: Optional[Path] = None,
        prefix: str = "seg",
    ) -> Dict[str, Any]:
        """Run inference and save the binary mask and visual overlay images to disk.

        Args:
            image: Input image.
            output_dir: Output folder for segmentation images.
            prefix: Prefix for saved file names.

        Returns:
            Dict with mask paths and metadata.
        """
        settings = get_settings()
        target_dir = output_dir or (settings.report_dir / "segmentation")
        target_dir.mkdir(parents=True, exist_ok=True)

        res = self.predict_mask(image)
        file_id = uuid.uuid4().hex[:12]

        # 1. Save binary mask (256 x 256)
        mask_filename = f"{prefix}_mask_{file_id}.png"
        mask_path = target_dir / mask_filename
        cv2.imwrite(str(mask_path), res["binary_mask"])

        # 2. Save overlay visualization on 256x256 resized input
        resized_orig = cv2.resize(res["original_image_rgb"], (256, 256))
        overlay = resized_orig.copy()
        # Highlight segmented region in translucent amber/red (BGR format for OpenCV)
        mask_bool = res["binary_mask"] > 0
        overlay[mask_bool] = (
            overlay[mask_bool] * 0.45 + np.array([255, 60, 20], dtype=np.float32) * 0.55
        ).astype(np.uint8)

        overlay_filename = f"{prefix}_overlay_{file_id}.jpg"
        overlay_path = target_dir / overlay_filename
        # Convert RGB to BGR before writing
        cv2.imwrite(str(overlay_path), cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))

        return {
            "predicted_region_ratio": res["predicted_region_ratio"],
            "threshold": res["threshold"],
            "mask_path": str(mask_path),
            "mask_filename": mask_filename,
            "overlay_path": str(overlay_path),
            "overlay_filename": overlay_filename,
        }
