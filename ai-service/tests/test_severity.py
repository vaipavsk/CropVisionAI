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
    """Test suite for validating the Domain-Informed SeverityAnalyzer (Task 42)."""

    def setUp(self) -> None:
        self.analyzer = SeverityAnalyzer()

    def test_healthy_classes_produce_low_severity_and_null_damage(self) -> None:
        """Test healthy classes: Corn_Healthy, Pepper_Healthy, Potato_Healthy, Rice_Healthy, Tomato_Healthy."""
        healthy_classes = [
            "Corn_Healthy",
            "Pepper_Healthy",
            "Potato_Healthy",
            "Rice_Healthy",
            "Tomato_Healthy",
        ]
        for class_name in healthy_classes:
            result = self.analyzer.analyze(class_name, 0.95)
            self.assertEqual(result["severity"], "LOW")
            self.assertIsNone(result["damage_percentage"])
            self.assertFalse(result["physical_damage_supported"])
            self.assertIn("No supported disease symptoms detected", result["severity_basis"])
            self.assertFalse(result["confidence_review_required"])
            self.assertEqual(result["risk_score"], 0.0)
            self.assertEqual(result["recommendation_score"], 1)

    def test_moderate_disease_classes(self) -> None:
        """Test moderate severity classes: Corn_Common_Rust, Pepper_Bacterial_Spot, Potato_Early_Blight, Tomato_Early_Blight."""
        moderate_classes = [
            "Corn_Common_Rust",
            "Pepper_Bacterial_Spot",
            "Potato_Early_Blight",
            "Tomato_Early_Blight",
        ]
        for class_name in moderate_classes:
            result = self.analyzer.analyze(class_name, 0.92)
            self.assertEqual(result["severity"], "MODERATE")
            self.assertIsNone(result["damage_percentage"])
            self.assertFalse(result["physical_damage_supported"])
            self.assertEqual(result["risk_score"], 5.0)
            self.assertEqual(result["recommendation_score"], 3)

    def test_high_disease_classes(self) -> None:
        """Test high severity classes: Potato_Late_Blight, Rice_Leaf_Blast, Rice_Tungro, Tomato_Late_Blight, Tomato_Yellow_Leaf_Curl_Virus."""
        high_classes = [
            "Potato_Late_Blight",
            "Rice_Leaf_Blast",
            "Rice_Tungro",
            "Tomato_Late_Blight",
            "Tomato_Yellow_Leaf_Curl_Virus",
        ]
        for class_name in high_classes:
            result = self.analyzer.analyze(class_name, 0.98)
            self.assertEqual(result["severity"], "HIGH")
            self.assertIsNone(result["damage_percentage"])
            self.assertFalse(result["physical_damage_supported"])
            self.assertEqual(result["risk_score"], 8.5)
            self.assertEqual(result["recommendation_score"], 4)

    def test_confidence_isolation_and_review_trigger(self) -> None:
        """Verify that confidence does NOT alter severity tier, but triggers review below 0.60."""
        # Test Potato_Late_Blight (HIGH) across confidence spectrum
        for conf in [0.95, 0.60, 0.599, 0.40]:
            res = self.analyzer.analyze("Potato_Late_Blight", conf)
            self.assertEqual(res["severity"], "HIGH")  # Severity remains HIGH
            self.assertIsNone(res["damage_percentage"])
            if conf >= 0.60:
                self.assertFalse(res["confidence_review_required"])
            else:
                self.assertTrue(res["confidence_review_required"])

        # Test Potato_Early_Blight (MODERATE) across confidence spectrum
        for conf in [0.95, 0.60, 0.599, 0.40]:
            res = self.analyzer.analyze("Potato_Early_Blight", conf)
            self.assertEqual(res["severity"], "MODERATE")  # Severity remains MODERATE (not upgraded to HIGH)
            self.assertIsNone(res["damage_percentage"])
            if conf >= 0.60:
                self.assertFalse(res["confidence_review_required"])
            else:
                self.assertTrue(res["confidence_review_required"])

    def test_yolo_detections_cannot_change_severity(self) -> None:
        """Verify that YOLO detections (COCO pretrained) have 0 impact on domain severity."""
        base_res = self.analyzer.analyze("Potato_Early_Blight", 0.90)
        
        # Add 10 simulated bounding box detections
        detections = [{"class_id": i, "confidence": 0.99, "bbox": [10, 10, 50, 50]} for i in range(10)]
        yolo_res = self.analyzer.analyze(
            classification={"class_name": "Potato_Early_Blight", "confidence": 0.90},
            detections=detections,
        )

        self.assertEqual(base_res["severity"], yolo_res["severity"])
        self.assertEqual(base_res["risk_score"], yolo_res["risk_score"])
        self.assertEqual(base_res["damage_percentage"], yolo_res["damage_percentage"])
        self.assertIsNone(yolo_res["damage_percentage"])

    def test_no_numeric_pseudo_damage_percentage_is_generated(self) -> None:
        """Verify damage_percentage is strictly None and physical_damage_supported is False."""
        all_test_classes = [
            "Corn_Healthy",
            "Corn_Common_Rust",
            "Potato_Early_Blight",
            "Potato_Late_Blight",
            "Rice_Leaf_Blast",
            "Tomato_Yellow_Leaf_Curl_Virus",
        ]
        for c in all_test_classes:
            res = self.analyzer.analyze(c, 0.85)
            self.assertIsNone(res["damage_percentage"])
            self.assertFalse(res["physical_damage_supported"])

    def test_invalid_inputs(self) -> None:
        """Test that malformed inputs raise InvalidSeverityInputError."""
        # Empty class name
        with self.assertRaises(InvalidSeverityInputError):
            self.analyzer.analyze("", 0.8)

        # Invalid confidence bounds
        with self.assertRaises(InvalidSeverityInputError):
            self.analyzer.analyze("Corn_Healthy", 1.5)

        with self.assertRaises(InvalidSeverityInputError):
            self.analyzer.analyze("Corn_Healthy", -0.1)

        # Malformed classification dict
        with self.assertRaises(InvalidSeverityInputError):
            self.analyzer.analyze({"invalid_key": "data"})


if __name__ == "__main__":
    unittest.main()
