from __future__ import annotations

import sys
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import MagicMock

from fastapi import HTTPException, UploadFile

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.services.upload_service import UploadService


class TestUploadValidation(unittest.TestCase):
    def setUp(self) -> None:
        # These cases fail before database or filesystem access is needed.
        self.service = UploadService(MagicMock())

    def test_rejects_corrupt_image_bytes(self) -> None:
        image = UploadFile(
            filename="not-really-an-image.jpg",
            file=BytesIO(b"not an image"),
            headers={"content-type": "image/jpeg"},
        )
        with self.assertRaises(HTTPException) as caught:
            self.service.create_upload(image)
        self.assertEqual(caught.exception.status_code, 400)

    def test_rejects_file_larger_than_limit(self) -> None:
        image = UploadFile(
            filename="too-large.jpg",
            file=BytesIO(b"x" * (UploadService.MAX_FILE_SIZE_BYTES + 1)),
            headers={"content-type": "image/jpeg"},
        )
        with self.assertRaises(HTTPException) as caught:
            self.service.create_upload(image)
        self.assertEqual(caught.exception.status_code, 413)


if __name__ == "__main__":
    unittest.main()
