from __future__ import annotations

import logging
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np

# Add the project root to the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ai.recommendation_models import RecommendationResult
from app.services.prediction_service import PredictionService, PredictionServiceError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_prediction_service")


class TestPredictionService(unittest.TestCase):
    """Test suite for validating the PredictionService pipeline orchestrator."""

    def setUp(self) -> None:
        self.db = MagicMock()
        self.upload_mock = MagicMock()
        self.upload_mock.id = 123
        self.upload_mock.file_path = "/path/to/crop_image.jpg"
        self.db.query().filter().first.return_value = self.upload_mock

        # Prepare mock outputs
        self.dummy_image_bgr = np.zeros((224, 224, 3), dtype=np.uint8)
        self.dummy_image_rgb = np.zeros((224, 224, 3), dtype=np.float32)
        self.detections_mock = [{"class_id": 1, "class_name": "Rust Spot", "confidence": 0.8}]
        self.classification_mock = {"class_index": 2, "class_name": "Leaf Rust", "confidence": 0.85}
        self.gradcam_mock = {"heatmap_path": "/path/to/gradcam_heatmap.jpg", "predicted_class": 2, "confidence": 0.85}
        self.severity_mock = {"damage_percentage": 35.0, "severity": "Moderate", "risk_score": 4.5, "recommendation_score": 3}
        self.recommendation_mock = RecommendationResult(
            recommendation="Refer to Manual Adjuster Review",
            decision="MANUAL_REVIEW",
            confidence=0.85,
            fraud_risk=0.0,
            requires_manual_review=True,
            reason="Claim flagged for manual review due to moderate severity.",
        )

    @patch("app.services.prediction_service.RecommendationEngine")
    @patch("app.services.prediction_service.SeverityAnalyzer")
    @patch("app.services.prediction_service.GradCAMGenerator")
    @patch("app.services.prediction_service.EfficientNetClassifier")
    @patch("app.services.prediction_service.YOLODetector")
    @patch("app.services.prediction_service.ImagePreprocessor")
    def test_successful_pipeline(
        self,
        MockPreprocessClass,
        MockDetectorClass,
        MockClassifierClass,
        MockGradcamClass,
        MockSeverityClass,
        MockRecommendationClass,
    ) -> None:
        """Test successful execution of the entire orchestrated prediction pipeline."""
        # 1. Setup mock instance returns
        mock_preprocessor = MockPreprocessClass.return_value
        mock_preprocessor.load_and_validate.return_value = self.dummy_image_bgr
        mock_preprocessor.preprocess.return_value = self.dummy_image_rgb

        mock_detector = MockDetectorClass.return_value
        mock_detector.detect.return_value = self.detections_mock

        mock_classifier = MockClassifierClass.return_value
        mock_classifier.classify.return_value = self.classification_mock
        mock_classifier.model = MagicMock()

        mock_gradcam = MockGradcamClass.return_value
        mock_gradcam.generate.return_value = self.gradcam_mock

        mock_severity = MockSeverityClass.return_value
        mock_severity.analyze.return_value = self.severity_mock

        mock_recommendation = MockRecommendationClass.return_value
        mock_recommendation.recommend.return_value = self.recommendation_mock

        # 2. Run service
        service = PredictionService(self.db)
        result = service.execute(123)

        # 3. Assert outputs
        self.assertEqual(result.upload_id, 123)
        self.assertEqual(result.image_path, "/path/to/crop_image.jpg")
        self.assertEqual(result.preprocessing_status, "SUCCESS")
        self.assertEqual(result.detections, self.detections_mock)
        self.assertEqual(result.classification, "Leaf Rust")
        self.assertEqual(result.classification_confidence, 0.85)
        self.assertEqual(result.damage_percentage, 35.0)
        self.assertEqual(result.severity, "Moderate")
        self.assertEqual(result.severity_score, 4.5)
        self.assertEqual(result.gradcam_image_path, "/path/to/gradcam_heatmap.jpg")
        self.assertEqual(result.insurance_recommendation, "MANUAL_REVIEW")
        self.assertEqual(result.fraud_risk, 0.0)
        self.assertEqual(result.pipeline_status, "COMPLETED")
        self.assertGreater(result.processing_time_ms, 0.0)

        # 4. Verify correct execution order and data passed between modules
        mock_preprocessor.load_and_validate.assert_called_once_with("/path/to/crop_image.jpg")
        mock_preprocessor.preprocess.assert_called_once_with(self.dummy_image_bgr)
        mock_detector.detect.assert_called_once_with("/path/to/crop_image.jpg")
        mock_classifier.classify.assert_called_once_with(self.dummy_image_rgb)
        mock_gradcam.generate.assert_called_once_with(
            model=mock_classifier.model,
            image=self.dummy_image_rgb,
            class_index=2,
            confidence=0.85,
            filename="gradcam_123.jpg",
        )
        mock_severity.analyze.assert_called_once_with(
            detections=self.detections_mock,
            classification=self.classification_mock,
        )
        mock_recommendation.recommend.assert_called_once_with(
            damage_percentage=35.0,
            severity_level="Moderate",
            risk_score=4.5,
            recommendation_score=3,
            classification="Leaf Rust",
            classification_confidence=0.85,
            detected_objects=self.detections_mock,
        )

    @patch("app.services.prediction_service.RecommendationEngine")
    @patch("app.services.prediction_service.SeverityAnalyzer")
    @patch("app.services.prediction_service.GradCAMGenerator")
    @patch("app.services.prediction_service.EfficientNetClassifier")
    @patch("app.services.prediction_service.YOLODetector")
    @patch("app.services.prediction_service.ImagePreprocessor")
    def test_preprocessing_failure(
        self,
        MockPreprocessClass,
        MockDetectorClass,
        MockClassifierClass,
        MockGradcamClass,
        MockSeverityClass,
        MockRecommendationClass,
    ) -> None:
        """Verify pipeline stops and raises exception when image preprocessing fails."""
        mock_preprocessor = MockPreprocessClass.return_value
        mock_preprocessor.load_and_validate.side_effect = ValueError("Corrupt file")

        service = PredictionService(self.db)
        with self.assertRaises(PredictionServiceError):
            service.execute(123)

        # Subsequent modules should NOT be instantiated or run
        MockDetectorClass.assert_not_called()
        MockClassifierClass.assert_not_called()

    @patch("app.services.prediction_service.RecommendationEngine")
    @patch("app.services.prediction_service.SeverityAnalyzer")
    @patch("app.services.prediction_service.GradCAMGenerator")
    @patch("app.services.prediction_service.EfficientNetClassifier")
    @patch("app.services.prediction_service.YOLODetector")
    @patch("app.services.prediction_service.ImagePreprocessor")
    def test_detector_failure(
        self,
        MockPreprocessClass,
        MockDetectorClass,
        MockClassifierClass,
        MockGradcamClass,
        MockSeverityClass,
        MockRecommendationClass,
    ) -> None:
        """Verify pipeline stops and raises exception when YOLO detector fails."""
        mock_preprocessor = MockPreprocessClass.return_value
        mock_preprocessor.load_and_validate.return_value = self.dummy_image_bgr
        mock_preprocessor.preprocess.return_value = self.dummy_image_rgb

        mock_detector = MockDetectorClass.return_value
        mock_detector.detect.side_effect = RuntimeError("YOLO model load error")

        service = PredictionService(self.db)
        with self.assertRaises(PredictionServiceError):
            service.execute(123)

        # Preprocessing completes, but classification is not run
        MockClassifierClass.assert_not_called()

    @patch("app.services.prediction_service.RecommendationEngine")
    @patch("app.services.prediction_service.SeverityAnalyzer")
    @patch("app.services.prediction_service.GradCAMGenerator")
    @patch("app.services.prediction_service.EfficientNetClassifier")
    @patch("app.services.prediction_service.YOLODetector")
    @patch("app.services.prediction_service.ImagePreprocessor")
    def test_classifier_failure(
        self,
        MockPreprocessClass,
        MockDetectorClass,
        MockClassifierClass,
        MockGradcamClass,
        MockSeverityClass,
        MockRecommendationClass,
    ) -> None:
        """Verify pipeline stops and raises exception when classifier fails."""
        mock_preprocessor = MockPreprocessClass.return_value
        mock_preprocessor.load_and_validate.return_value = self.dummy_image_bgr
        mock_preprocessor.preprocess.return_value = self.dummy_image_rgb

        mock_detector = MockDetectorClass.return_value
        mock_detector.detect.return_value = self.detections_mock

        mock_classifier = MockClassifierClass.return_value
        mock_classifier.classify.side_effect = KeyError("Classification category map error")

        service = PredictionService(self.db)
        with self.assertRaises(PredictionServiceError):
            service.execute(123)

        # Gradcam should not run
        MockGradcamClass.assert_not_called()

    @patch("app.services.prediction_service.RecommendationEngine")
    @patch("app.services.prediction_service.SeverityAnalyzer")
    @patch("app.services.prediction_service.GradCAMGenerator")
    @patch("app.services.prediction_service.EfficientNetClassifier")
    @patch("app.services.prediction_service.YOLODetector")
    @patch("app.services.prediction_service.ImagePreprocessor")
    def test_gradcam_failure(
        self,
        MockPreprocessClass,
        MockDetectorClass,
        MockClassifierClass,
        MockGradcamClass,
        MockSeverityClass,
        MockRecommendationClass,
    ) -> None:
        """Verify pipeline stops and raises exception when Grad-CAM generator fails."""
        mock_preprocessor = MockPreprocessClass.return_value
        mock_preprocessor.load_and_validate.return_value = self.dummy_image_bgr
        mock_preprocessor.preprocess.return_value = self.dummy_image_rgb

        mock_detector = MockDetectorClass.return_value
        mock_detector.detect.return_value = self.detections_mock

        mock_classifier = MockClassifierClass.return_value
        mock_classifier.classify.return_value = self.classification_mock

        mock_gradcam = MockGradcamClass.return_value
        mock_gradcam.generate.side_effect = Exception("Heatmap composition overflow")

        service = PredictionService(self.db)
        with self.assertRaises(PredictionServiceError):
            service.execute(123)

        # SeverityAnalyzer should not run
        MockSeverityClass.assert_not_called()

    @patch("app.services.prediction_service.RecommendationEngine")
    @patch("app.services.prediction_service.SeverityAnalyzer")
    @patch("app.services.prediction_service.GradCAMGenerator")
    @patch("app.services.prediction_service.EfficientNetClassifier")
    @patch("app.services.prediction_service.YOLODetector")
    @patch("app.services.prediction_service.ImagePreprocessor")
    def test_severity_failure(
        self,
        MockPreprocessClass,
        MockDetectorClass,
        MockClassifierClass,
        MockGradcamClass,
        MockSeverityClass,
        MockRecommendationClass,
    ) -> None:
        """Verify pipeline stops and raises exception when SeverityAnalyzer fails."""
        mock_preprocessor = MockPreprocessClass.return_value
        mock_preprocessor.load_and_validate.return_value = self.dummy_image_bgr
        mock_preprocessor.preprocess.return_value = self.dummy_image_rgb

        mock_detector = MockDetectorClass.return_value
        mock_detector.detect.return_value = self.detections_mock

        mock_classifier = MockClassifierClass.return_value
        mock_classifier.classify.return_value = self.classification_mock

        mock_gradcam = MockGradcamClass.return_value
        mock_gradcam.generate.return_value = self.gradcam_mock

        mock_severity = MockSeverityClass.return_value
        mock_severity.analyze.side_effect = ValueError("Invalid severity thresholds")

        service = PredictionService(self.db)
        with self.assertRaises(PredictionServiceError):
            service.execute(123)

        # RecommendationEngine should not run
        MockRecommendationClass.assert_not_called()

    @patch("app.services.prediction_service.RecommendationEngine")
    @patch("app.services.prediction_service.SeverityAnalyzer")
    @patch("app.services.prediction_service.GradCAMGenerator")
    @patch("app.services.prediction_service.EfficientNetClassifier")
    @patch("app.services.prediction_service.YOLODetector")
    @patch("app.services.prediction_service.ImagePreprocessor")
    def test_recommendation_failure(
        self,
        MockPreprocessClass,
        MockDetectorClass,
        MockClassifierClass,
        MockGradcamClass,
        MockSeverityClass,
        MockRecommendationClass,
    ) -> None:
        """Verify pipeline stops and raises exception when RecommendationEngine fails."""
        mock_preprocessor = MockPreprocessClass.return_value
        mock_preprocessor.load_and_validate.return_value = self.dummy_image_bgr
        mock_preprocessor.preprocess.return_value = self.dummy_image_rgb

        mock_detector = MockDetectorClass.return_value
        mock_detector.detect.return_value = self.detections_mock

        mock_classifier = MockClassifierClass.return_value
        mock_classifier.classify.return_value = self.classification_mock

        mock_gradcam = MockGradcamClass.return_value
        mock_gradcam.generate.return_value = self.gradcam_mock

        mock_severity = MockSeverityClass.return_value
        mock_severity.analyze.return_value = self.severity_mock

        mock_recommendation = MockRecommendationClass.return_value
        mock_recommendation.recommend.side_effect = Exception("Recommendation business logic exception")

        service = PredictionService(self.db)
        with self.assertRaises(PredictionServiceError):
            service.execute(123)

    def test_upload_not_found(self) -> None:
        """Verify pipeline raises Exception when upload record does not exist in DB."""
        self.db.query().filter().first.return_value = None
        service = PredictionService(self.db)
        with self.assertRaises(PredictionServiceError):
            service.execute(999)


if __name__ == "__main__":
    unittest.main()
