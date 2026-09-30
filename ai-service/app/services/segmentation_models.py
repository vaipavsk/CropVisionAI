from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class SegmentationResult(BaseModel):
    """Structured result containing experimental Small U-Net segmentation outputs."""

    upload_id: int = Field(..., description="Database identifier of the upload record")
    image_path: str = Field(..., description="Media route of the processed image")
    segmentation_available: bool = Field(default=True, description="Indicates if segmentation model was successfully executed")
    mask_available: bool = Field(default=True, description="Indicates if the binary mask was generated")
    predicted_region_ratio: Optional[float] = Field(
        default=None,
        description="Ratio of segmented foreground pixels to total image pixels [0.0, 1.0]. Experimental spatial evidence only; NOT physical crop damage percentage.",
    )
    threshold: float = Field(default=0.5, description="Probability cutoff threshold applied during mask discretization")
    mask_image_path: Optional[str] = Field(default=None, description="Public media route to the generated binary mask")
    overlay_image_path: Optional[str] = Field(default=None, description="Public media route to the visual overlay image")
    interpretation: str = Field(
        default="experimental_spatial_evidence",
        description="Semantic designation of this measurement: experimental auxiliary spatial evidence only.",
    )
    scientific_limitation: str = Field(
        default="Predicted segmentation region ratio is experimental spatial evidence and is not equivalent to physical crop damage percentage.",
        description="Authoritative scientific limitation notice.",
    )
    processing_time_ms: float = Field(default=0.0, description="Total execution time of the segmentation inference in milliseconds")


class SegmentationResponse(BaseModel):
    """API response wrapper for Small U-Net segmentation endpoint."""

    success: bool = Field(default=True, description="Indicates if the segmentation request succeeded")
    message: str = Field(default="Segmentation completed successfully.", description="Descriptive status message")
    data: SegmentationResult = Field(..., description="Detailed segmentation result payload")
