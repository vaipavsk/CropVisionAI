from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

# Add the project root to the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.database.session import get_db
from app.main import app
from app.services.prediction_models import PredictionResult
from app.services.prediction_service import PredictionServiceError


class TestPredictionRouter(unittest.TestCase):
    """Test suite for validating the prediction FastAPI endpoint using TestClient."""

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.db_mock = MagicMock()
        # Override the db session dependency injection
        app.dependency_overrides[get_db] = lambda: self.db_mock

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    @patch("app.routers.prediction.PredictionService")
    def test_successful_prediction(self, MockPredictionServiceClass: MagicMock) -> None:
        """Verify successful prediction pipeline runs and yields status 200 with formatted payload."""
        # 1. Setup Mock Service and database query outputs
        mock_service = MockPredictionServiceClass.return_value
        mock_result = PredictionResult(
            upload_id=123,
            image_path="/path/to/mock_image.jpg",
            preprocessing_status="SUCCESS",
            detections=[{"class_id": 1, "class_name": "Rust Spot", "confidence": 0.8}],
            classification="Leaf Rust",
            classification_confidence=0.85,
            damage_percentage=35.0,
            severity="Moderate",
            severity_score=4.5,
            gradcam_image_path="/path/to/gradcam_heatmap.jpg",
            insurance_recommendation="MANUAL_REVIEW",
            fraud_risk=0.0,
            processing_time_ms=120.5,
            pipeline_status="COMPLETED",
        )
        mock_service.predict.return_value = mock_result

        mock_upload = MagicMock()
        mock_upload.id = 123
        self.db_mock.query().filter().first.return_value = mock_upload

        # 2. Call route
        response = self.client.post("/predict/123")

        # 3. Assert response details
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["message"], "Prediction completed successfully.")
        
        data_payload = json_data["data"]
        self.assertEqual(data_payload["upload_id"], 123)
        self.assertEqual(data_payload["classification"], "Leaf Rust")
        self.assertEqual(data_payload["severity"], "Moderate")
        self.assertEqual(data_payload["insurance_recommendation"], "MANUAL_REVIEW")
        
        mock_service.predict.assert_called_once_with(123)

    def test_upload_not_found(self) -> None:
        """Verify endpoint returns status 404 when the target upload record does not exist."""
        self.db_mock.query().filter().first.return_value = None

        response = self.client.post("/predict/999")
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    @patch("app.routers.prediction.PredictionService")
    def test_prediction_service_error(self, MockPredictionServiceClass: MagicMock) -> None:
        """Verify endpoint returns status 500 when PredictionService raises a pipeline execution error."""
        mock_service = MockPredictionServiceClass.return_value
        mock_service.predict.side_effect = PredictionServiceError("YOLO inference failure")

        mock_upload = MagicMock()
        mock_upload.id = 123
        self.db_mock.query().filter().first.return_value = mock_upload

        response = self.client.post("/predict/123")
        self.assertEqual(response.status_code, 500)
        self.assertIn("prediction pipeline failed", response.json()["detail"].lower())

    def test_invalid_upload_id_value(self) -> None:
        """Verify endpoint returns status 422 validation error when upload_id <= 0."""
        response = self.client.post("/predict/0")
        self.assertEqual(response.status_code, 422)
        self.assertIn("positive integer", response.json()["detail"].lower())

        response = self.client.post("/predict/-5")
        self.assertEqual(response.status_code, 422)

    def test_invalid_upload_id_type(self) -> None:
        """Verify FastAPI automatically returns status 422 validation error when upload_id is not an integer."""
        response = self.client.post("/predict/not-an-integer")
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
