from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List
from pydantic import BaseModel, Field


class PredictionResult(BaseModel):
    """Structured result containing the entire prediction pipeline outputs."""

    upload_id: int = Field(..., description="Database identifier of the upload record")
    image_path: str = Field(..., description="Absolute file path of the processed image")
    preprocessing_status: str = Field(..., description="Status of the image preprocessing stage")
    detections: List[Dict[str, Any]] = Field(..., description="List of detected crop/damage spot objects")
    classification: str = Field(..., description="Predicted crop disease or healthy category class")
    classification_confidence: float = Field(..., description="Classifier model confidence score")
    damage_percentage: float = Field(..., description="Estimated percentage of crop damage")
    severity: str = Field(..., description="Categorical severity level (Low, Moderate, Severe)")
    severity_score: float = Field(..., description="Calculated risk score metric")
    gradcam_image_path: str = Field(..., description="File path of the generated Grad-CAM heatmap visualization")
    insurance_recommendation: str = Field(..., description="Automated claim payout decision statement")
    fraud_risk: float = Field(..., description="Calculated fraud risk probability value")
    processing_time_ms: float = Field(..., description="Total execution time of the pipeline in milliseconds")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Time when the prediction was generated")
    pipeline_status: str = Field(..., description="Final status of the pipeline (e.g., COMPLETED)")


class PredictionResponse(BaseModel):
    """API response model for crop damage prediction pipeline."""

    success: bool = Field(default=True, description="Indicates if the prediction request succeeded")
    message: str = Field(default="Prediction completed successfully.", description="Descriptive status message")
    data: PredictionResult = Field(..., description="Detailed prediction result payload")

