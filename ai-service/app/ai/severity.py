from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.config import get_settings

logger = logging.getLogger(__name__)


class SeverityError(Exception):
    """Base exception for all severity analysis errors."""
    pass


class InvalidSeverityInputError(SeverityError, ValueError):
    """Exception raised when severity analyzer input formats are invalid or corrupt."""
    pass


class SeverityAnalyzer:
    """A rule-based evaluation engine to estimate crop damage severity, risk score,

    and action recommendation levels from multi-modal model outputs.
    """

    def __init__(
        self,
        low_threshold: float | None = None,
        moderate_threshold: float | None = None,
        high_threshold: float | None = None,
        severe_threshold: float | None = None,
    ) -> None:
        """Initialize the SeverityAnalyzer with configurable thresholds.

        Args:
            low_threshold: Under this percentage, damage is classified as Low.
            moderate_threshold: Under this, damage is classified as Moderate (if above low).
            high_threshold: Used for detailed risk mappings.
            severe_threshold: Above this, recommendations are set to highest urgency.
        """
        settings = get_settings()
        self.low_threshold = low_threshold if low_threshold is not None else settings.low_damage_threshold
        self.moderate_threshold = moderate_threshold if moderate_threshold is not None else settings.moderate_damage_threshold
        self.high_threshold = high_threshold if high_threshold is not None else settings.high_damage_threshold
        self.severe_threshold = severe_threshold if severe_threshold is not None else settings.severe_damage_threshold

        logger.info(
            f"Initialized SeverityAnalyzer with thresholds: "
            f"Low={self.low_threshold}%, Moderate={self.moderate_threshold}%, "
            f"High={self.high_threshold}%, Severe={self.severe_threshold}%"
        )

    def analyze(
        self,
        detections: List[Dict[str, Any]],
        classification: Dict[str, Any],
        gradcam: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Analyze the fused results of detection and classification to assess damage severity.

        Args:
            detections: List of dictionary outputs from YOLODetector.
            classification: Dictionary outcome from EfficientNetClassifier.
            gradcam: Optional Grad-CAM dictionary metadata.

        Returns:
            Dict[str, Any]: Structured severity metrics:
                {
                    "damage_percentage": float,
                    "severity": str,  # "Low", "Moderate", "Severe"
                    "risk_score": float,  # Range [0.0, 10.0]
                    "recommendation_score": int  # Range [1, 5]
                }

        Raises:
            InvalidSeverityInputError: If incoming structures are malformed.
        """
        # 1. Input validations
        if not isinstance(detections, list):
            logger.error("Detections input is not a list.")
            raise InvalidSeverityInputError("Detections input must be a list.")

        for idx, det in enumerate(detections):
            if not isinstance(det, dict):
                logger.error(f"Detection at index {idx} is not a dictionary.")
                raise InvalidSeverityInputError(f"Each detection element must be a dictionary. Got type {type(det)}")
            if "confidence" not in det:
                logger.error(f"Detection at index {idx} is missing 'confidence' score.")
                raise InvalidSeverityInputError("Each detection dictionary must contain a 'confidence' key.")

        if not isinstance(classification, dict):
            logger.error("Classification input is not a dictionary.")
            raise InvalidSeverityInputError("Classification input must be a dictionary.")

        if "class_name" not in classification or "confidence" not in classification:
            logger.error("Classification dictionary missing mandatory keys.")
            raise InvalidSeverityInputError("Classification must contain 'class_name' and 'confidence' keys.")

        # 2. Rule Engine calculation of damage percentage
        class_name = str(classification.get("class_name", "")).lower()
        class_conf = float(classification.get("confidence", 0.0))
        is_healthy = "healthy" in class_name

        # Calculate localized damage spots score (from YOLO detections)
        # Sum confidence values of all detections multiplied by standard weight
        yolo_spots_score = sum(float(det.get("confidence", 1.0)) * 15.0 for det in detections)

        if is_healthy:
            # Crop is classified as healthy, adjust damage down based on classifier confidence
            reduction = class_conf * 25.0
            damage_percentage = max(0.0, yolo_spots_score - reduction)
        else:
            # Crop is classified as diseased/damaged, combine spot count and disease confidence
            disease_influence = class_conf * 45.0
            damage_percentage = min(100.0, yolo_spots_score + disease_influence)
            # Guarantee a base floor if a disease class is predicted with high confidence
            if class_conf > 0.6:
                damage_percentage = max(damage_percentage, 20.0)

        # 3. Determine severity category based on thresholds
        if damage_percentage < self.low_threshold:
            severity = "Low"
        elif damage_percentage < self.moderate_threshold:
            # We map this range to Moderate (as low threshold is exceeded)
            severity = "Moderate"
        else:
            # Exceeded moderate damage threshold, maps to Severe
            severity = "Severe"

        # 4. Compute Risk Score (Float 0.0 to 10.0)
        # Combines damage percentage and classification confidence
        risk_base = (damage_percentage / 100.0) * 7.0
        if not is_healthy:
            risk_base += class_conf * 3.0
        else:
            # Reduce risk score for healthy crops
            risk_base -= class_conf * 2.0

        risk_score = min(10.0, max(0.0, risk_base))

        # 5. Compute Action Recommendation Score (Integer 1 to 5)
        # 1: No action (completely healthy)
        # 2: Monitoring (low damage detected)
        # 3: Standard treatment (moderate damage)
        # 4: Urgent quarantine/intervention (severe damage below critical threshold)
        # 5: Critical/Total block intervention (severe damage exceeding severe threshold)
        if severity == "Low":
            recommendation_score = 1 if damage_percentage == 0.0 else 2
        elif severity == "Moderate":
            recommendation_score = 3
        else:  # Severe
            if damage_percentage >= self.severe_threshold:
                recommendation_score = 5
            else:
                recommendation_score = 4

        logger.info(
            f"Rule evaluation output: percentage={damage_percentage:.2f}%, "
            f"severity={severity}, risk={risk_score:.2f}, recommendation={recommendation_score}"
        )

        return {
            "damage_percentage": float(round(damage_percentage, 2)),
            "severity": severity,
            "risk_score": float(round(risk_score, 2)),
            "recommendation_score": int(recommendation_score),
        }
