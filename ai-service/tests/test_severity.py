from __future__ import annotations

import logging
import sys
import unittest
from pathlib import Path

# Add the project root to the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ai import (
    InvalidSeverityInputError,
    SeverityAnalyzer,
    SeverityError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_severity")


class TestSeverityAnalyzer(unittest.TestCase):
    """Test suite for validating the SeverityAnalyzer component."""

    def test_low_severity_healthy(self) -> None:
        """Test severity analysis for a healthy crop classification with no detections."""
        analyzer = SeverityAnalyzer()
        detections = []
        classification = {
            "class_index": 0,
            "class_name": "Healthy Wheat",
            "confidence": 0.95,
        }

        result = analyzer.analyze(detections, classification)
        logger.info(f"Healthy output result: {result}")

        self.assertIsInstance(result, dict)
        self.assertEqual(result["severity"], "Low")
        self.assertEqual(result["damage_percentage"], 0.0)
        self.assertEqual(result["recommendation_score"], 1)
        self.assertTrue(0.0 <= result["risk_score"] <= 1.0)

    def test_moderate_severity_diseased(self) -> None:
        """Test severity analysis for a disease classification with minor detections."""
        analyzer = SeverityAnalyzer()
        detections = [
            {"class_id": 1, "class_name": "Rust Spot", "confidence": 0.8}
        ]
        classification = {
            "class_index": 3,
            "class_name": "Leaf Rust",
            "confidence": 0.5,
        }

        # Expected damage: spots weight (0.8 * 15.0 = 12.0) + disease influence (0.5 * 45.0 = 22.5) = 34.5%
        # Thresholds: Low < 15%, Moderate < 40%, Severe >= 40%
        # Thus, 34.5% should be mapped to "Moderate"
        result = analyzer.analyze(detections, classification)
        logger.info(f"Moderate output result: {result}")

        self.assertEqual(result["severity"], "Moderate")
        self.assertEqual(result["damage_percentage"], 34.5)
        self.assertEqual(result["recommendation_score"], 3)
        self.assertTrue(2.0 <= result["risk_score"] <= 7.0)

    def test_severe_severity_critical(self) -> None:
        """Test severity analysis for high spot counts and severe classifications."""
        analyzer = SeverityAnalyzer()
        detections = [
            {"class_id": 1, "class_name": "Lesion", "confidence": 0.9},
            {"class_id": 1, "class_name": "Lesion", "confidence": 0.8},
            {"class_id": 1, "class_name": "Lesion", "confidence": 0.75},
        ]
        classification = {
            "class_index": 4,
            "class_name": "Stem Borer Damage",
            "confidence": 0.9,
        }

        result = analyzer.analyze(detections, classification)
        logger.info(f"Severe output result: {result}")

        self.assertEqual(result["severity"], "Severe")
        self.assertGreaterEqual(result["damage_percentage"], 40.0)
        # Recommendation score should be 4 or 5 depending on the severe threshold (90%)
        # Here: yolo = (0.9 + 0.8 + 0.75) * 15 = 36.75; disease = 0.9 * 45 = 40.5; total = 77.25%
        # Since 77.25% < 90% (severe threshold), recommendation score should be 4
        self.assertEqual(result["recommendation_score"], 4)

        # Force severe threshold lower to trigger critical recommendation score 5
        analyzer_custom = SeverityAnalyzer(severe_threshold=70.0)
        result_custom = analyzer_custom.analyze(detections, classification)
        self.assertEqual(result_custom["recommendation_score"], 5)

    def test_configurable_thresholds_override(self) -> None:
        """Test that overriding thresholds dynamically changes mapping categories."""
        # Standard: 0-15 Low, 15-40 Moderate, 40+ Severe
        # Let's check a damage percentage of 20%
        detections = []
        classification = {
            "class_name": "Mild Rust",
            "confidence": 0.4444, # 0.4444 * 45 = ~20%
        }
        
        analyzer_std = SeverityAnalyzer()
        result_std = analyzer_std.analyze(detections, classification)
        self.assertEqual(result_std["severity"], "Moderate")  # 20.0% is in [15, 40)

        # Dynamic override: low_threshold=25.0
        analyzer_low_shifted = SeverityAnalyzer(low_threshold=25.0)
        result_shifted = analyzer_low_shifted.analyze(detections, classification)
        self.assertEqual(result_shifted["severity"], "Low")   # 20.0% is < 25.0

    def test_invalid_inputs(self) -> None:
        """Test that malformed inputs raise InvalidSeverityInputError."""
        analyzer = SeverityAnalyzer()

        # Detections not a list
        with self.assertRaises(InvalidSeverityInputError):
            analyzer.analyze("not a list", {})  # type: ignore[arg-type]

        # Individual detection not a dict
        with self.assertRaises(InvalidSeverityInputError):
            analyzer.analyze(["not a dict"], {})  # type: ignore[arg-type]

        # Missing confidence in detection
        with self.assertRaises(InvalidSeverityInputError):
            analyzer.analyze([{"class_id": 1}], {})  # type: ignore[list-item]

        # Classification not a dict
        with self.assertRaises(InvalidSeverityInputError):
            analyzer.analyze([], "not a dict")  # type: ignore[arg-type]

        # Missing keys in classification
        with self.assertRaises(InvalidSeverityInputError):
            analyzer.analyze([], {"confidence": 0.8})


if __name__ == "__main__":
    unittest.main()
