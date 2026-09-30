from __future__ import annotations

import logging
import sys
import unittest
from pathlib import Path

# Add the project root to the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ai.recommendation import RecommendationEngine
from app.ai.recommendation_exceptions import InvalidRecommendationInputError
from app.ai.recommendation_models import RecommendationResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_recommendation")


class TestRecommendationEngine(unittest.TestCase):
    """Test suite for validating the RecommendationEngine component."""

    def setUp(self) -> None:
        self.engine = RecommendationEngine(
            high_confidence_threshold=0.90,
            min_confidence_threshold=0.60,
        )

    def test_approve_high_severity_high_confidence(self) -> None:
        """Test automatic approval for HIGH damage and high classification confidence."""
        # Rule: High severity & high confidence -> Approve
        result = self.engine.recommend(
            damage_percentage=75.0,
            severity_level="HIGH",
            risk_score=8.5,
            recommendation_score=4,
            classification="Leaf Rust",
            classification_confidence=0.95,
            detected_objects=3,
        )
        logger.info(f"Approve result: {result}")
        self.assertEqual(result.decision, "Approve")
        self.assertFalse(result.requires_manual_review)
        self.assertIn("strong ai classification confidence", result.reason.lower())
        self.assertEqual(result.confidence, 0.95)

        # Approve with severity_level "High" (case-insensitive)
        result_high = self.engine.recommend(
            damage_percentage=80.0,
            severity_level="high",
            risk_score=9.0,
            recommendation_score=5,
            classification="Wheat Blast",
            classification_confidence=0.95,
            detected_objects=5,
        )
        self.assertEqual(result_high.decision, "Approve")

    def test_reject_no_detections(self) -> None:
        """Test rejection when no objects are detected in the image (Rule 1)."""
        # Case with detected_objects as list
        result_list = self.engine.recommend(
            damage_percentage=25.0,
            severity_level="HIGH",
            risk_score=8.5,
            recommendation_score=4,
            classification="Leaf Rust",
            classification_confidence=0.85,
            detected_objects=[],
        )
        logger.info(f"Reject no detections (list) result: {result_list}")
        # High disease with moderate confidence triggers manual review
        self.assertEqual(result_list.decision, "Manual Review")
        self.assertTrue(result_list.requires_manual_review)
        self.assertIn("moderate ai confidence", result_list.reason.lower())
        self.assertEqual(result_list.confidence, 0.85)

        # Case with detected_objects as int 0
        result_int = self.engine.recommend(
            damage_percentage=0.0,
            severity_level="Low",
            risk_score=0.0,
            recommendation_score=1,
            classification="Healthy Wheat",
            classification_confidence=0.95,
            detected_objects=0,
        )
        self.assertEqual(result_int.decision, "Reject")
        self.assertEqual(result_int.fraud_risk, 0.0)  # No damage claimed -> 0 fraud risk

    def test_reject_low_severity(self) -> None:
        """Test rejection when crop damage severity is low and confidence is sufficient."""
        result = self.engine.recommend(
            damage_percentage=5.0,
            severity_level="Low",
            risk_score=1.5,
            recommendation_score=2,
            classification="Mild Rust",
            classification_confidence=0.75,
            detected_objects=2,
        )
        logger.info(f"Reject low severity result: {result}")
        self.assertEqual(result.decision, "Reject")
        self.assertFalse(result.requires_manual_review)
        self.assertIn("no supported disease symptoms", result.reason.lower())
        self.assertEqual(result.confidence, 0.75)

    def test_manual_review_low_confidence(self) -> None:
        """Test flagging for manual review when confidence is below 0.60."""
        result = self.engine.recommend(
            damage_percentage=85.0,
            severity_level="HIGH",
            risk_score=9.0,
            recommendation_score=5,
            classification="Leaf Rust",
            classification_confidence=0.55,
            detected_objects=3,
        )
        logger.info(f"Manual review low confidence result: {result}")
        self.assertEqual(result.decision, "Manual Review")
        self.assertTrue(result.requires_manual_review)
        self.assertIn("low ai classification confidence", result.reason.lower())
        self.assertEqual(result.confidence, 0.55)

    def test_manual_review_low_confidence_override_low_severity(self) -> None:
        """Test that low classification confidence (e.g. 38% 'conch') overrides Low severity Reject decision."""
        result = self.engine.recommend(
            damage_percentage=17.0,
            severity_level="LOW",
            risk_score=2.0,
            recommendation_score=2,
            classification="conch",
            classification_confidence=0.38,
            detected_objects=1,
        )
        logger.info(f"Low confidence override result: {result}")
        self.assertEqual(result.decision, "Manual Review")
        self.assertTrue(result.requires_manual_review)
        self.assertIn("low ai classification confidence (38.0%)", result.reason.lower())

    def test_manual_review_unknown_classification(self) -> None:
        """Test flagging for manual review when classification starts with unknown_class_."""
        result = self.engine.recommend(
            damage_percentage=75.0,
            severity_level="HIGH",
            risk_score=8.5,
            recommendation_score=4,
            classification="unknown_class_4",
            classification_confidence=0.85,
            detected_objects=3,
        )
        logger.info(f"Manual review unknown class result: {result}")
        self.assertEqual(result.decision, "Manual Review")
        self.assertTrue(result.requires_manual_review)
        self.assertIn("unrecognized crop classification", result.reason.lower())

    def test_manual_review_moderate_severity(self) -> None:
        """Test flagging for manual review when severity is moderate."""
        result = self.engine.recommend(
            damage_percentage=55.0,
            severity_level="MODERATE",
            risk_score=4.5,
            recommendation_score=3,
            classification="Leaf Rust",
            classification_confidence=0.75,
            detected_objects=3,
        )
        logger.info(f"Manual review moderate severity result: {result}")
        self.assertEqual(result.decision, "Manual Review")
        self.assertTrue(result.requires_manual_review)
        self.assertIn("moderate agronomic disease threat requires field inspector assessment", result.reason.lower())

    def test_manual_review_fallback_borderline_confidence(self) -> None:
        """Test manual review fallback for high damage when confidence is moderate but below the high threshold."""
        # High severity, confidence 0.70 is <= 0.90
        result = self.engine.recommend(
            damage_percentage=75.0,
            severity_level="HIGH",
            risk_score=7.5,
            recommendation_score=4,
            classification="Leaf Rust",
            classification_confidence=0.70,
            detected_objects=3,
        )
        logger.info(f"Manual review fallback result: {result}")
        self.assertEqual(result.decision, "Manual Review")
        self.assertTrue(result.requires_manual_review)
        self.assertIn("moderate ai confidence", result.reason.lower())

    def test_invalid_inputs(self) -> None:
        """Test that malformed inputs raise InvalidRecommendationInputError."""
        # 1. invalid damage_percentage type & range
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend("not a number", "Low", 2.0, 2, "Rust", 0.8, 1)  # type: ignore[arg-type]
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(-5.0, "Low", 2.0, 2, "Rust", 0.8, 1)
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(105.0, "Low", 2.0, 2, "Rust", 0.8, 1)

        # 2. invalid severity_level type & value
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, 123, 2.0, 2, "Rust", 0.8, 1)  # type: ignore[arg-type]
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Critical", 2.0, 2, "Rust", 0.8, 1)

        # 3. invalid risk_score type & range
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", "not a number", 2, "Rust", 0.8, 1)  # type: ignore[arg-type]
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", -1.0, 2, "Rust", 0.8, 1)
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 11.0, 2, "Rust", 0.8, 1)

        # 4. invalid recommendation_score type & range
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 2.0, "not int", "Rust", 0.8, 1)  # type: ignore[arg-type]
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 2.0, 0, "Rust", 0.8, 1)
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 2.0, 6, "Rust", 0.8, 1)

        # 5. invalid classification type
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 2.0, 2, 999, 0.8, 1)  # type: ignore[arg-type]

        # 6. invalid classification_confidence type & range
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 2.0, 2, "Rust", "str", 1)  # type: ignore[arg-type]
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 2.0, 2, "Rust", -0.1, 1)
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 2.0, 2, "Rust", 1.1, 1)

        # 7. invalid detected_objects type & negative values
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 2.0, 2, "Rust", 0.8, "invalid")  # type: ignore[arg-type]
        with self.assertRaises(InvalidRecommendationInputError):
            self.engine.recommend(20.0, "Low", 2.0, 2, "Rust", 0.8, -3)

    def test_boundary_conditions_and_custom_thresholds(self) -> None:
        """Test boundary values for confidence thresholds and custom initialization."""
        # Custom high confidence threshold set to 0.65
        custom_engine = RecommendationEngine(high_confidence_threshold=0.65, min_confidence_threshold=0.50)
        
        # HIGH + confidence 0.70 >= 0.65 -> Should now Approve (instead of Manual Review)
        result = custom_engine.recommend(
            damage_percentage=75.0,
            severity_level="HIGH",
            risk_score=7.5,
            recommendation_score=4,
            classification="Leaf Rust",
            classification_confidence=0.70,
            detected_objects=3,
        )
        self.assertEqual(result.decision, "Approve")

        # Boundary test: confidence exactly at 0.90
        result_exact_boundary = self.engine.recommend(
            damage_percentage=75.0,
            severity_level="HIGH",
            risk_score=7.5,
            recommendation_score=4,
            classification="Leaf Rust",
            classification_confidence=0.90,
            detected_objects=3,
        )
        # Should flag for manual review because 0.90 <= 0.90 high confidence threshold
        self.assertEqual(result_exact_boundary.decision, "Manual Review")

    def test_legacy_severe_label_backward_compatibility(self) -> None:
        """Test that legacy 'Severe' label is gracefully mapped to HIGH for backwards compatibility."""
        result = self.engine.recommend(
            damage_percentage=85.0,
            severity_level="Severe",
            risk_score=9.0,
            recommendation_score=5,
            classification="Wheat Blast",
            classification_confidence=0.95,
            detected_objects=5,
        )
        self.assertEqual(result.decision, "Approve")

    def test_fraud_risk_healthy_inconsistencies(self) -> None:
        """Test specific fraud risk scenarios for healthy crop with claimed damage."""
        # 1. Claiming >50% damage but classified as healthy
        result_high_suspicion = self.engine.recommend(
            damage_percentage=60.0,
            severity_level="Low",
            risk_score=1.0,
            recommendation_score=2,
            classification="Healthy Wheat",
            classification_confidence=0.80,
            detected_objects=3,
        )
        self.assertEqual(result_high_suspicion.fraud_risk, 0.85)

        # 2. Claiming moderate damage (35%) but classified as healthy
        result_mod_suspicion = self.engine.recommend(
            damage_percentage=35.0,
            severity_level="Low",
            risk_score=1.0,
            recommendation_score=2,
            classification="Healthy Wheat",
            classification_confidence=0.80,
            detected_objects=3,
        )
        # Calculated: 0.40 + (35.0 - 20.0)/30 * 0.40 = 0.40 + 0.20 = 0.60
        self.assertEqual(result_mod_suspicion.fraud_risk, 0.60)


if __name__ == "__main__":
    unittest.main()
