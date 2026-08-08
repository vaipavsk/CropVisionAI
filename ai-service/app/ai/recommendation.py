from __future__ import annotations

import logging
from typing import Any, List

from app.ai.recommendation_exceptions import InvalidRecommendationInputError
from app.ai.recommendation_models import RecommendationResult

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """A rule-based evaluation engine to process crop analysis output and generate

    automated insurance claim decisions (Approve, Reject, or Manual Review).
    """

    def __init__(self, high_confidence_threshold: float = 0.90) -> None:
        """Initialize the RecommendationEngine with configurable thresholds.

        Args:
            high_confidence_threshold: Threshold above which classifier confidence is considered "high".
        """
        self.high_confidence_threshold = high_confidence_threshold
        logger.info(
            f"Initialized RecommendationEngine with high_confidence_threshold: {self.high_confidence_threshold}"
        )

    def recommend(
        self,
        damage_percentage: float,
        severity_level: str,
        risk_score: float,
        recommendation_score: int,
        classification: str,
        classification_confidence: float,
        detected_objects: int | List[Any],
    ) -> RecommendationResult:
        """Evaluate a crop insurance claim based on AI assessment metrics.

        Args:
            damage_percentage: Estimated percentage of crop damage.
            severity_level: Categorical severity level ("Low", "Moderate", "Severe").
            risk_score: Calculated risk score.
            recommendation_score: Urgency action score (1 to 5).
            classification: Predicted crop disease or category label.
            classification_confidence: Classifier model confidence score.
            detected_objects: Number of detected objects (int) or the list of detected object records.

        Returns:
            RecommendationResult: Struct containing the claim recommendation, decision,
                                 confidence, fraud risk, manual review requirements, and reason.

        Raises:
            InvalidRecommendationInputError: If any of the inputs fail validation checks.
        """
        # 1. Validation checks
        # Validation for damage_percentage
        if not isinstance(damage_percentage, (int, float)):
            logger.error(f"Invalid damage_percentage type: {type(damage_percentage)}")
            raise InvalidRecommendationInputError("damage_percentage must be a number.")
        if not (0.0 <= damage_percentage <= 100.0):
            logger.error(f"damage_percentage out of range [0.0, 100.0]: {damage_percentage}")
            raise InvalidRecommendationInputError("damage_percentage must be between 0.0 and 100.0.")

        # Validation for severity_level
        if not isinstance(severity_level, str):
            logger.error(f"Invalid severity_level type: {type(severity_level)}")
            raise InvalidRecommendationInputError("severity_level must be a string.")
        
        severity_lower = severity_level.strip().lower()
        if severity_lower not in ("low", "moderate", "severe", "high"):
            logger.error(f"Invalid severity_level value: '{severity_level}'")
            raise InvalidRecommendationInputError(
                "severity_level must be one of 'Low', 'Moderate', 'Severe', or 'High'."
            )

        # Validation for risk_score
        if not isinstance(risk_score, (int, float)):
            logger.error(f"Invalid risk_score type: {type(risk_score)}")
            raise InvalidRecommendationInputError("risk_score must be a number.")
        if not (0.0 <= risk_score <= 10.0):
            logger.error(f"risk_score out of range [0.0, 10.0]: {risk_score}")
            raise InvalidRecommendationInputError("risk_score must be between 0.0 and 10.0.")

        # Validation for recommendation_score
        if not isinstance(recommendation_score, int):
            logger.error(f"Invalid recommendation_score type: {type(recommendation_score)}")
            raise InvalidRecommendationInputError("recommendation_score must be an integer.")
        if not (1 <= recommendation_score <= 5):
            logger.error(f"recommendation_score out of range [1, 5]: {recommendation_score}")
            raise InvalidRecommendationInputError("recommendation_score must be between 1 and 5.")

        # Validation for classification
        if not isinstance(classification, str):
            logger.error(f"Invalid classification type: {type(classification)}")
            raise InvalidRecommendationInputError("classification must be a string.")

        # Validation for classification_confidence
        if not isinstance(classification_confidence, (int, float)):
            logger.error(f"Invalid classification_confidence type: {type(classification_confidence)}")
            raise InvalidRecommendationInputError("classification_confidence must be a number.")
        if not (0.0 <= classification_confidence <= 1.0):
            logger.error(f"classification_confidence out of range [0.0, 1.0]: {classification_confidence}")
            raise InvalidRecommendationInputError("classification_confidence must be between 0.0 and 1.0.")

        # Validation for detected_objects
        if isinstance(detected_objects, list):
            obj_count = len(detected_objects)
        elif isinstance(detected_objects, int):
            if detected_objects < 0:
                logger.error(f"Negative detected_objects count: {detected_objects}")
                raise InvalidRecommendationInputError("detected_objects count cannot be negative.")
            obj_count = detected_objects
        else:
            logger.error(f"Invalid detected_objects type: {type(detected_objects)}")
            raise InvalidRecommendationInputError("detected_objects must be an integer or a list.")

        logger.info(
            f"Evaluating recommendation: damage={damage_percentage}%, severity='{severity_level}', "
            f"risk={risk_score}, rec_score={recommendation_score}, classification='{classification}', "
            f"conf={classification_confidence:.4f}, objects={obj_count}"
        )

        # 2. Decision Logic Rules (applied in order)
        classification_lower = classification.strip().lower()

        if damage_percentage < 40.0:
            decision = "Reject"
            reason = "Minimal visible damage detected."
        elif 40.0 <= damage_percentage <= 70.0:
            decision = "Manual Review"
            reason = "Moderate damage requires inspector verification."
        else:
            if classification_confidence > self.high_confidence_threshold:
                decision = "Approve"
                reason = "High severity with strong AI confidence."
            else:
                decision = "Manual Review"
                reason = "High severity but insufficient AI confidence; requires manual review."

        # 3. Compute Recommendation confidence and fraud risk
        if decision == "Reject" and obj_count == 0:
            recommendation_confidence = 1.0
        else:
            recommendation_confidence = float(round(classification_confidence, 4))

        # Calculate fraud risk score [0.0, 1.0] based on inconsistencies
        fraud_risk = 0.0

        if obj_count == 0:
            if damage_percentage > 0.0:
                fraud_risk = 0.90
        elif "healthy" in classification_lower:
            if damage_percentage > 50.0:
                fraud_risk = 0.85
            elif damage_percentage > 20.0:
                fraud_risk = 0.40 + (damage_percentage - 20.0) / 30.0 * 0.40
        else:
            # Diseased/damaged crop
            if damage_percentage < 10.0 and risk_score > 7.0:
                fraud_risk = 0.50
            elif damage_percentage > 80.0 and risk_score < 3.0:
                fraud_risk = 0.65

        # Format recommendation text
        recommendation_text = decision

        requires_manual_review = (decision == "Manual Review")

        logger.info(
            f"Recommendation decision: decision={decision}, confidence={recommendation_confidence:.4f}, "
            f"fraud_risk={fraud_risk:.4f}, manual_review={requires_manual_review}"
        )

        return RecommendationResult(
            recommendation=recommendation_text,
            decision=decision,
            confidence=recommendation_confidence,
            fraud_risk=float(round(fraud_risk, 4)),
            requires_manual_review=requires_manual_review,
            reason=reason,
        )
