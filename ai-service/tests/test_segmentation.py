from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch
import numpy as np
import torch
from fastapi.testclient import TestClient
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ai.segmentation import (
    PlantSegmentationModel,
    SmallUNet,
    ConvBlock,
    SegmentationError,
    SegmentationInferenceError,
    SegmentationModelLoadError,
)
from app.config import get_settings
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.main import app
from app.models.upload import Upload
from app.models.user import User, UserRole
from app.services.segmentation_models import SegmentationResult
from app.services.segmentation_service import SegmentationService, SegmentationServiceError


class TestSegmentationModel(unittest.TestCase):
    """Unit test suite for PlantSeg Small U-Net segmentation model."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.settings = get_settings()
        cls.weights_path = cls.settings.segmentation_weights_absolute_path

    def test_01_checkpoint_loading(self) -> None:
        """1. Verify checkpoint loads successfully on CPU."""
        self.assertIsNotNone(self.weights_path)
        self.assertTrue(self.weights_path.is_file(), f"Checkpoint file missing: {self.weights_path}")

        ckpt = torch.load(self.weights_path, map_location="cpu")
        self.assertIsInstance(ckpt, dict)
        self.assertIn("model_state_dict", ckpt)
        self.assertEqual(ckpt.get("epoch"), 10)
        self.assertAlmostEqual(ckpt.get("val_dice", 0.0), 0.542358, places=4)

    def test_02_model_initialization_and_weights_match(self) -> None:
        """2. Verify model architecture initializes and matches state_dict strictly."""
        model = PlantSegmentationModel(weights_path=self.weights_path, device="cpu")
        self.assertIsInstance(model.model, SmallUNet)
        self.assertFalse(model.model.training)

    def test_03_rgb_preprocessing(self) -> None:
        """3. Verify RGB preprocessing yields (1, 3, 256, 256) float tensor in [0.0, 1.0]."""
        model = PlantSegmentationModel(weights_path=self.weights_path, device="cpu")
        mock_np = np.random.randint(0, 256, size=(400, 600, 3), dtype=np.uint8)

        tensor, orig_rgb = model.preprocess_image(mock_np)
        self.assertEqual(tensor.shape, (1, 3, 256, 256))
        self.assertEqual(tensor.dtype, torch.float32)
        self.assertTrue(0.0 <= tensor.min().item() and tensor.max().item() <= 1.0)
        self.assertEqual(orig_rgb.shape, (400, 600, 3))

    def test_04_output_tensor_shape(self) -> None:
        """4. Verify raw model forward pass produces tensor shape [1, 1, 256, 256]."""
        model = SmallUNet(in_channels=3, out_channels=1, base_channels=16)
        x = torch.randn(1, 3, 256, 256)
        out = model(x)
        self.assertEqual(out.shape, (1, 1, 256, 256))

    def test_05_sigmoid_output_range(self) -> None:
        """5. Verify sigmoid transformation maps logits to [0.0, 1.0]."""
        model = PlantSegmentationModel(weights_path=self.weights_path, device="cpu")
        mock_img = Image.new("RGB", (256, 256), color=(60, 120, 40))
        result = model.predict_mask(mock_img)

        prob_map = result["probability_map"]
        self.assertEqual(prob_map.shape, (256, 256))
        self.assertTrue(0.0 <= prob_map.min() and prob_map.max() <= 1.0)

    def test_06_binary_thresholding(self) -> None:
        """6. Verify binary thresholding yields 0 or 255 values."""
        model = PlantSegmentationModel(weights_path=self.weights_path, device="cpu")
        mock_img = Image.new("RGB", (256, 256), color=(100, 180, 50))
        result = model.predict_mask(mock_img, threshold=0.5)

        bin_mask = result["binary_mask"]
        unique_vals = set(np.unique(bin_mask))
        self.assertTrue(unique_vals.issubset({0, 255}))

    def test_07_predicted_region_ratio(self) -> None:
        """7. Verify predicted_region_ratio calculation is bounded in [0.0, 1.0]."""
        model = PlantSegmentationModel(weights_path=self.weights_path, device="cpu")
        mock_img = Image.new("RGB", (256, 256), color=(80, 150, 60))
        result = model.predict_mask(mock_img)

        ratio = result["predicted_region_ratio"]
        self.assertIsInstance(ratio, float)
        self.assertTrue(0.0 <= ratio <= 1.0)

    def test_08_missing_checkpoint_handling(self) -> None:
        """8. Verify graceful exception when checkpoint is missing."""
        with self.assertRaises(SegmentationModelLoadError):
            PlantSegmentationModel(weights_path=Path("/non/existent/path/unet.pth"))

    def test_09_invalid_image_handling(self) -> None:
        """9. Verify invalid image inputs raise SegmentationInferenceError."""
        model = PlantSegmentationModel(weights_path=self.weights_path, device="cpu")
        with self.assertRaises(SegmentationInferenceError):
            model.preprocess_image(image=12345)  # Invalid type

    def test_10_artifact_generation(self) -> None:
        """10. Verify artifact generator outputs valid mask and overlay images."""
        model = PlantSegmentationModel(weights_path=self.weights_path, device="cpu")
        mock_img = Image.new("RGB", (200, 200), color=(120, 180, 70))
        artifacts = model.generate_and_save_artifacts(mock_img, prefix="test")

        self.assertIn("mask_path", artifacts)
        self.assertIn("overlay_path", artifacts)
        self.assertIn("predicted_region_ratio", artifacts)
        self.assertTrue(Path(artifacts["mask_path"]).is_file())
        self.assertTrue(Path(artifacts["overlay_path"]).is_file())


class TestSegmentationRouter(unittest.TestCase):
    """Test suite for FastAPI /segmentation/{upload_id} endpoint."""

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.db_mock = MagicMock()
        self.mock_user = MagicMock(spec=User, id=10, role=UserRole.FARMER)

        app.dependency_overrides[get_db] = lambda: self.db_mock
        app.dependency_overrides[get_current_user] = lambda: self.mock_user

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_invalid_upload_id_returns_422(self) -> None:
        response = self.client.post("/segmentation/0")
        self.assertEqual(response.status_code, 422)

    def test_upload_not_found_returns_404(self) -> None:
        self.db_mock.query.return_value.filter.return_value.first.return_value = None
        response = self.client.post("/segmentation/999")
        self.assertEqual(response.status_code, 404)

    def test_unauthorized_user_returns_403(self) -> None:
        mock_upload = MagicMock(spec=Upload, id=55, user_id=999)  # different user
        self.db_mock.query.return_value.filter.return_value.first.return_value = mock_upload
        response = self.client.post("/segmentation/55")
        self.assertEqual(response.status_code, 403)

    @patch("app.routers.segmentation.SegmentationService")
    def test_successful_segmentation_response(self, MockServiceClass: MagicMock) -> None:
        mock_upload = MagicMock(spec=Upload, id=10, user_id=10, file_path="app/uploads/test.jpg")
        self.db_mock.query.return_value.filter.return_value.first.return_value = mock_upload

        mock_service = MockServiceClass.return_value
        mock_service.execute.return_value = SegmentationResult(
            upload_id=10,
            image_path="/media/uploads/test.jpg",
            segmentation_available=True,
            mask_available=True,
            predicted_region_ratio=0.1852,
            threshold=0.5,
            mask_image_path="/media/segmentation/upload_10_mask_abc.png",
            overlay_image_path="/media/segmentation/upload_10_overlay_abc.jpg",
            interpretation="experimental_spatial_evidence",
            scientific_limitation="Predicted segmentation region ratio is experimental spatial evidence and is not equivalent to physical crop damage percentage.",
            processing_time_ms=45.2,
        )

        response = self.client.post("/segmentation/10")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["upload_id"], 10)
        self.assertEqual(data["data"]["predicted_region_ratio"], 0.1852)
        self.assertEqual(data["data"]["interpretation"], "experimental_spatial_evidence")
        self.assertIn("not equivalent to physical crop damage", data["data"]["scientific_limitation"])


if __name__ == "__main__":
    unittest.main()
