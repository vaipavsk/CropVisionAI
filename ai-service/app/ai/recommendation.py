from __future__ import annotations

import logging
from typing import Any, List, Optional

from app.ai.recommendation_exceptions import InvalidRecommendationInputError
from app.ai.recommendation_models import RecommendationResult

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Domain-informed claim triage engine for automated insurance adjudication.

    Provides automated recommendation decisions (Approve, Reject, or Manual Review)
    based on verified pathogen threat tiers and model classification reliability.
    """

    def __init__(
        self,
        high_confidence_threshold: float = 0.90,
        min_confidence_threshold: float = 0.60,
    ) -> None:
        """Initialize the RecommendationEngine with configurable thresholds.

        Args:
            high_confidence_threshold: Threshold above which classifier confidence is considered "high".
            min_confidence_threshold: Minimum threshold below which AI prediction requires manual review.
                                      NOTE: This 60% threshold is an UNCALIBRATED HEURISTIC for inspector
                                      triage, NOT an underwriting warranty or calibrated probability.
        """
        self.high_confidence_threshold = high_confidence_threshold
        self.min_confidence_threshold = min_confidence_threshold
        logger.info(
            f"Initialized RecommendationEngine with high_confidence_threshold: {self.high_confidence_threshold}, "
            f"min_confidence_threshold: {self.min_confidence_threshold}"
        )

    def recommend(
        self,
        *args: Any,
        severity_level: Optional[str] = None,
        classification: Optional[str] = None,
        classification_confidence: Optional[float] = None,
        damage_percentage: Optional[float] = None,
        risk_score: Optional[float] = None,
        recommendation_score: Optional[int] = None,
        detected_objects: Optional[int | List[Any]] = None,
        **kwargs: Any,
    ) -> RecommendationResult:
        """Evaluate a crop insurance claim based on AI assessment and domain severity.

        Args:
            severity_level: Categorical severity level ("LOW", "MODERATE", "HIGH", "INSUFFICIENT_EVIDENCE").
            classification: Predicted crop disease or healthy category label.
            classification_confidence: Classifier model confidence score [0.0, 1.0].
            damage_percentage: Optional physical damage percentage (None if unmeasured).
            risk_score: Optional calculated risk score.
            recommendation_score: Optional urgency action score (1 to 5).
            detected_objects: Optional count or list of detected objects.

        Returns:
            RecommendationResult: Struct containing the claim recommendation, decision,
                                  confidence, fraud risk, manual review requirements, and reason.

        Raises:
            InvalidRecommendationInputError: If any of the inputs fail validation checks.
        """
        # Parse positional args if provided
        if args:
            if isinstance(args[0], (int, float)) or (args[0] is not None and not isinstance(args[0], str)):
                # Legacy positional signature: (damage_percentage, severity_level, risk_score, recommendation_score, classification, classification_confidence, detected_objects)
                if damage_percentage is None and len(args) > 0:
                    damage_percentage = args[0]
                if severity_level is None and len(args) > 1:
                    severity_level = args[1]
                if risk_score is None and len(args) > 2:
                    risk_score = args[2]
                if recommendation_score is None and len(args) > 3:
                    recommendation_score = args[3]
                if classification is None and len(args) > 4:
                    classification = args[4]
                if classification_confidence is None and len(args) > 5:
                    classification_confidence = args[5]
                if detected_objects is None and len(args) > 6:
                    detected_objects = args[6]
            elif isinstance(args[0], str) and len(args) > 1 and isinstance(args[1], str) and args[0].upper() in ("LOW", "MODERATE", "HIGH", "SEVERE", "INSUFFICIENT_EVIDENCE"):
                # New positional signature: (severity_level, classification, classification_confidence, ...)
                if severity_level is None and len(args) > 0:
                    severity_level = args[0]
                if classification is None and len(args) > 1:
                    classification = args[1]
                if classification_confidence is None and len(args) > 2:
                    classification_confidence = args[2]
                if damage_percentage is None and len(args) > 3:
                    damage_percentage = args[3]
                if risk_score is None and len(args) > 4:
                    risk_score = args[4]
                if recommendation_score is None and len(args) > 5:
                    recommendation_score = args[5]
                if detected_objects is None and len(args) > 6:
                    detected_objects = args[6]
            elif isinstance(args[0], str) and (len(args) == 1 or not isinstance(args[1], (int, float))):
                # Malformed legacy first arg (e.g. test_invalid_inputs passing "not a number" as damage_percentage)
                if damage_percentage is None:
                    damage_percentage = args[0]
                if severity_level is None and len(args) > 1:
                    severity_level = args[1]
                if risk_score is None and len(args) > 2:
                    risk_score = args[2]
                if recommendation_score is None and len(args) > 3:
                    recommendation_score = args[3]
                if classification is None and len(args) > 4:
                    classification = args[4]
                if classification_confidence is None and len(args) > 5:
                    classification_confidence = args[5]
                if detected_objects is None and len(args) > 6:
                    detected_objects = args[6]

        # 1. Validation checks
        if not isinstance(classification, str):
            logger.error(f"Invalid classification type: {type(classification)}")
            raise InvalidRecommendationInputError("classification must be a string.")

        if not isinstance(classification_confidence, (int, float)):
            logger.error(f"Invalid classification_confidence type: {type(classification_confidence)}")
            raise InvalidRecommendationInputError("classification_confidence must be a number.")
        
        if not (0.0 <= classification_confidence <= 1.0):
            logger.error(f"classification_confidence out of range [0.0, 1.0]: {classification_confidence}")
            raise InvalidRecommendationInputError("classification_confidence must be between 0.0 and 1.0.")

        if not isinstance(severity_level, str):
            logger.error(f"Invalid severity_level type: {type(severity_level)}")
            raise InvalidRecommendationInputError("severity_level must be a string.")
        
        severity_upper = severity_level.strip().upper()
        if severity_upper not in ("LOW", "MODERATE", "HIGH", "SEVERE", "INSUFFICIENT_EVIDENCE"):
            logger.error(f"Invalid severity_level value: '{severity_level}'")
            raise InvalidRecommendationInputError(
                "severity_level must be one of 'LOW', 'MODERATE', 'HIGH', or 'INSUFFICIENT_EVIDENCE'."
            )

        if damage_percentage is not None:
            if not isinstance(damage_percentage, (int, float)):
                raise InvalidRecommendationInputError("damage_percentage must be a number or None.")
            if not (0.0 <= damage_percentage <= 100.0):
                raise InvalidRecommendationInputError("damage_percentage must be between 0.0 and 100.0.")

        if risk_score is not None:
            if not isinstance(risk_score, (int, float)) or not (0.0 <= risk_score <= 10.0):
                raise InvalidRecommendationInputError("risk_score must be a number between 0.0 and 10.0.")

        if recommendation_score is not None:
            if not isinstance(recommendation_score, int) or not (1 <= recommendation_score <= 5):
                raise InvalidRecommendationInputError("recommendation_score must be an integer between 1 and 5.")

        if detected_objects is not None:
            if isinstance(detected_objects, int) and detected_objects < 0:
                raise InvalidRecommendationInputError("detected_objects count cannot be negative.")
            elif not isinstance(detected_objects, (int, list)):
                raise InvalidRecommendationInputError("detected_objects must be an integer, list, or None.")

        classification_lower = classification.strip().lower()
        is_healthy = "healthy" in classification_lower

        logger.info(
            f"Evaluating recommendation: severity='{severity_upper}', classification='{classification}', "
            f"conf={classification_confidence:.4f}"
        )

        # 2. Decision Logic Rules
        # Rule 1: Low-confidence safety guardrail (Uncalibrated heuristic threshold)
        if classification_confidence < self.min_confidence_threshold:
            decision = "Manual Review"
            reason = f"Low AI classification confidence ({classification_confidence * 100:.1f}%) requires manual review by an inspector."
        
        # Rule 2: Unrecognized class or insufficient domain evidence
        elif classification_lower.startswith("unknown_class_") or severity_upper == "INSUFFICIENT_EVIDENCE":
            decision = "Manual Review"
            reason = "Unrecognized crop classification or insufficient agronomic evidence requires manual review by an inspector."
        
        # Rule 3: Healthy crop / Low severity baseline
        elif is_healthy or severity_upper == "LOW":
            decision = "Reject"
            reason = "No supported disease symptoms detected in the submitted image."
        
        # Rule 4: Moderate progressive disease
        elif severity_upper == "MODERATE":
            decision = "Manual Review"
            reason = "Moderate agronomic disease threat requires field inspector assessment of canopy extent."
        
        # Rule 5: High severity threat disease
        else:  # HIGH / SEVERE
            if classification_confidence > self.high_confidence_threshold:
                decision = "Approve"
                reason = "High agronomic disease threat confirmed with strong AI classification confidence."
            else:
                decision = "Manual Review"
                reason = "High agronomic disease threat but moderate AI confidence; requires manual inspector review."

        recommendation_confidence = float(round(classification_confidence, 4))
        
        # Flag inconsistent healthy predictions if ever paired with high risk or claimed damage
        fraud_risk = 0.0
        if is_healthy and damage_percentage is not None and damage_percentage > 50.0:
            fraud_risk = 0.85
        elif is_healthy and damage_percentage is not None and damage_percentage > 20.0:
            fraud_risk = float(round(0.40 + ((damage_percentage - 20.0) / 30.0) * 0.40, 4))
        elif is_healthy and severity_upper in ("HIGH", "SEVERE"):
            fraud_risk = 0.85

        requires_manual_review = bool(decision == "Manual Review")

        logger.info(
            f"Recommendation verdict: decision={decision}, confidence={recommendation_confidence:.4f}, "
            f"fraud_risk={fraud_risk:.2f}, manual_review={requires_manual_review}"
        )

        return RecommendationResult(
            recommendation=decision,
            decision=decision,
            confidence=recommendation_confidence,
            fraud_risk=float(round(fraud_risk, 4)),
            requires_manual_review=requires_manual_review,
            reason=reason,
        )
