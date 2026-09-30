from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.ai.agronomic_knowledge import get_agronomic_profile

logger = logging.getLogger(__name__)


class SeverityError(Exception):
    """Base exception for all severity analysis errors."""
    pass


class InvalidSeverityInputError(SeverityError, ValueError):
    """Exception raised when severity analyzer input formats are invalid or corrupt."""
    pass


class SeverityAnalyzer:
    """Domain-informed crop damage severity analyzer.

    Replaces uncalibrated pseudo-damage percentages with authoritative agronomic
    disease impact profiles (LOW / MODERATE / HIGH / INSUFFICIENT_EVIDENCE).

    Physical damage percentage is explicitly set to None (not measured), as the
    classification dataset lacks spatial ground-truth lesion masks.
    """

    def __init__(self) -> None:
        """Initialize the Domain-Informed SeverityAnalyzer."""
        logger.info("Initialized Domain-Informed SeverityAnalyzer.")

    def analyze(
        self,
        predicted_class_or_detections_or_dict: Any = None,
        confidence_or_classification: Any = None,
        detections: Optional[List[Dict[str, Any]]] = None,
        classification: Optional[Dict[str, Any]] = None,
        gradcam: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Assess crop damage severity using domain-informed disease profiles.

        Supports flexible signatures:
            - analyze("Potato_Late_Blight", 0.95)
            - analyze(classification={"class_name": "Potato_Late_Blight", "confidence": 0.95})
            - analyze(detections=[...], classification={"class_name": "...", "confidence": ...})
            - analyze(detections, classification)

        Returns:
            Dict[str, Any]: Structured domain-informed severity metrics:
                {
                    "severity": str,  # "LOW", "MODERATE", "HIGH", "INSUFFICIENT_EVIDENCE"
                    "severity_basis": str,
                    "confidence": float,
                    "confidence_review_required": bool,
                    "damage_percentage": None,  # Explicitly None (no spatial model)
                    "physical_damage_supported": False,
                    "risk_score": float,  # Categorical risk representation [0.0, 10.0]
                    "recommendation_score": int  # Range [1, 5]
                }

        Raises:
            InvalidSeverityInputError: If incoming structures are malformed.
        """
        raw_class = None
        raw_conf = None

        # Handle keyword arguments
        if classification is not None:
            if not isinstance(classification, dict):
                raise InvalidSeverityInputError("Classification input must be a dictionary.")
            if "class_name" not in classification or "confidence" not in classification:
                raise InvalidSeverityInputError("Classification must contain 'class_name' and 'confidence' keys.")
            raw_class = classification["class_name"]
            raw_conf = classification["confidence"]
        elif isinstance(predicted_class_or_detections_or_dict, str):
            raw_class = predicted_class_or_detections_or_dict
            raw_conf = confidence_or_classification
        elif isinstance(predicted_class_or_detections_or_dict, dict):
            if "class_name" not in predicted_class_or_detections_or_dict or "confidence" not in predicted_class_or_detections_or_dict:
                raise InvalidSeverityInputError("Classification dict must contain 'class_name' and 'confidence' keys.")
            raw_class = predicted_class_or_detections_or_dict["class_name"]
            raw_conf = predicted_class_or_detections_or_dict["confidence"]
        elif isinstance(confidence_or_classification, dict):
            if "class_name" not in confidence_or_classification or "confidence" not in confidence_or_classification:
                raise InvalidSeverityInputError("Classification dict must contain 'class_name' and 'confidence' keys.")
            raw_class = confidence_or_classification["class_name"]
            raw_conf = confidence_or_classification["confidence"]
        else:
            raise InvalidSeverityInputError("Classification input missing or malformed.")

        # Validate class_name
        if not isinstance(raw_class, str) or not raw_class.strip():
            raise InvalidSeverityInputError("Classification class_name must be a non-empty string.")
        class_name = raw_class.strip()

        # Validate confidence
        try:
            class_conf = float(raw_conf)
        except (ValueError, TypeError) as exc:
            raise InvalidSeverityInputError("Classification confidence must be a valid float.") from exc

        if not (0.0 <= class_conf <= 1.0):
            raise InvalidSeverityInputError("Classification confidence must be between 0.0 and 1.0.")

        # Validations on detections if provided (for backwards compatibility)
        dets_to_check = detections if detections is not None else (
            predicted_class_or_detections_or_dict if isinstance(predicted_class_or_detections_or_dict, list) else None
        )
        if dets_to_check is not None:
            if not isinstance(dets_to_check, list):
                raise InvalidSeverityInputError("Detections input must be a list.")
            for det in dets_to_check:
                if not isinstance(det, dict):
                    raise InvalidSeverityInputError(f"Each detection element must be a dictionary. Got type {type(det)}")
                if "confidence" not in det:
                    raise InvalidSeverityInputError("Each detection dictionary must contain a 'confidence' key.")

        # Retrieve authoritative agronomic profile
        profile = get_agronomic_profile(class_name)
        severity_tier = profile["severity_tier"]
        severity_basis = profile["severity_basis"]

        # Model reliability check (uncalibrated heuristic for inspector triage)
        confidence_review_required = bool(class_conf < 0.60)

        # Map categorical severity to numerical risk representations
        if severity_tier == "LOW":
            risk_score = 0.0 if "healthy" in class_name.lower() else 1.5
            recommendation_score = 1 if "healthy" in class_name.lower() else 2
        elif severity_tier == "MODERATE":
            risk_score = 5.0
            recommendation_score = 3
        elif severity_tier == "HIGH":
            risk_score = 8.5
            recommendation_score = 4
        else:  # INSUFFICIENT_EVIDENCE
            risk_score = 5.0
            recommendation_score = 3

        logger.info(
            f"Domain severity evaluation: class='{class_name}', severity='{severity_tier}', "
            f"conf={class_conf:.4f}, review_required={confidence_review_required}"
        )

        return {
            "severity": severity_tier,
            "severity_basis": severity_basis,
            "confidence": round(class_conf, 4),
            "confidence_review_required": confidence_review_required,
            "damage_percentage": None,
            "physical_damage_supported": False,
            "risk_score": float(risk_score),
            "recommendation_score": int(recommendation_score),
        }
