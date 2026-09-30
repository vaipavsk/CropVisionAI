from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from fastapi import HTTPException
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.models.user import UserRole
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.main import app
from app.routers.media import _can_view_upload, _safe_filename


class TestMediaAuthorization(unittest.TestCase):
    def setUp(self) -> None:
        self.owner_upload = SimpleNamespace(user_id=17)
        self.owner = SimpleNamespace(id=17, role=UserRole.FARMER)
        self.other_farmer = SimpleNamespace(id=18, role=UserRole.FARMER)
        self.inspector = SimpleNamespace(id=19, role=UserRole.INSPECTOR)
        self.admin = SimpleNamespace(id=20, role=UserRole.ADMIN)

    def test_farmer_can_access_only_owned_upload(self) -> None:
        self.assertTrue(_can_view_upload(self.owner, self.owner_upload))
        self.assertFalse(_can_view_upload(self.other_farmer, self.owner_upload))

    def test_inspector_and_admin_can_access_review_evidence(self) -> None:
        self.assertTrue(_can_view_upload(self.inspector, self.owner_upload))
        self.assertTrue(_can_view_upload(self.admin, self.owner_upload))

    def test_media_filename_rejects_path_traversal(self) -> None:
        with self.assertRaises(HTTPException) as error:
            _safe_filename("../secret.jpg")
        self.assertEqual(error.exception.status_code, 404)

    def test_authenticated_media_routes_enforce_ownership_and_inspector_access(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            upload_path = Path(directory) / "owned.jpg"
            upload_path.write_bytes(b"jpeg-data")
            upload = SimpleNamespace(user_id=17, file_name="owned.jpg", file_path=str(upload_path), mime_type="image/jpeg")
            db = MagicMock()
            db.query.return_value.filter.return_value.first.return_value = upload

            app.dependency_overrides[get_db] = lambda: db
            app.dependency_overrides[get_current_user] = lambda: self.owner
            try:
                response = TestClient(app).get("/media/uploads/owned.jpg")
                self.assertEqual(response.status_code, 200)

                app.dependency_overrides[get_current_user] = lambda: self.other_farmer
                response = TestClient(app).get("/media/uploads/owned.jpg")
                self.assertEqual(response.status_code, 403)

                app.dependency_overrides[get_current_user] = lambda: self.inspector
                response = TestClient(app).get("/media/uploads/owned.jpg")
                self.assertEqual(response.status_code, 200)
            finally:
                app.dependency_overrides.clear()

    def test_authenticated_gradcam_route_enforces_owner_or_inspector_access(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            heatmap_dir = Path(directory) / "heatmaps"
            heatmap_dir.mkdir()
            (heatmap_dir / "heat.jpg").write_bytes(b"jpeg-data")
            upload = SimpleNamespace(user_id=17)
            prediction = SimpleNamespace(
                upload=upload,
                explanation='{"gradcam_image_path": "C:/reports/heatmaps/heat.jpg"}',
            )
            db = MagicMock()
            db.query.return_value.options.return_value.filter.return_value.all.return_value = [prediction]
            settings = SimpleNamespace(report_dir=Path(directory))

            app.dependency_overrides[get_db] = lambda: db
            try:
                with patch("app.routers.media.get_settings", return_value=settings):
                    app.dependency_overrides[get_current_user] = lambda: self.owner
                    self.assertEqual(TestClient(app).get("/media/heatmaps/heat.jpg").status_code, 200)

                    app.dependency_overrides[get_current_user] = lambda: self.other_farmer
                    self.assertEqual(TestClient(app).get("/media/heatmaps/heat.jpg").status_code, 403)

                    app.dependency_overrides[get_current_user] = lambda: self.inspector
                    self.assertEqual(TestClient(app).get("/media/heatmaps/heat.jpg").status_code, 200)
            finally:
                app.dependency_overrides.clear()


if __name__ == "__main__":
    unittest.main()
