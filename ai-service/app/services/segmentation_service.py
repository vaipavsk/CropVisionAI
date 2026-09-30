from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session

from app.ai.segmentation import (
    PlantSegmentationModel,
    SegmentationError,
    SegmentationInferenceError,
    SegmentationModelLoadError,
)
from app.config import get_settings
from app.models.upload import Upload
from app.services.base_service import BaseService
from app.services.segmentation_models import SegmentationResult

logger = logging.getLogger(__name__)


class SegmentationServiceError(Exception):
    """Exception raised when the segmentation service fails."""
    pass


class SegmentationService(BaseService):
    """Orchestrates experimental Small U-Net plant segmentation on uploaded crop images."""

    def __init__(self, db: Session, model: Optional[PlantSegmentationModel] = None) -> None:
        """Initialize the SegmentationService.

        Args:
            db: SQLAlchemy database session.
            model: Optional instantiated PlantSegmentationModel instance.
        """
        self.db = db
        self.model = model

    def _get_model(self) -> PlantSegmentationModel:
        if self.model is not None:
            return self.model
        try:
            return PlantSegmentationModel()
        except SegmentationModelLoadError as exc:
            logger.error(f"Failed to initialize PlantSegmentationModel: {str(exc)}")
            raise SegmentationServiceError(f"Segmentation model unavailable: {str(exc)}") from exc

    def execute(self, upload_id: int, threshold: Optional[float] = None) -> SegmentationResult:
        """Run experimental Small U-Net segmentation on an upload record.

        Args:
            upload_id: Database ID of the upload.
            threshold: Optional probability threshold for binary mask discretization.

        Returns:
            SegmentationResult: Structured result containing ratio, mask, and media paths.

        Raises:
            SegmentationServiceError: If upload is not found or inference fails.
        """
        start_time = time.perf_counter()

        # 1. Fetch upload record
        upload = self.db.query(Upload).filter(Upload.id == upload_id).first()
        if not upload:
            raise SegmentationServiceError(f"Upload record with ID {upload_id} not found.")

        image_path = Path(upload.file_path)
        if not image_path.is_file():
            raise SegmentationServiceError(f"Upload image file missing on disk: {image_path}")

        # 2. Run segmentation inference and artifact generation
        try:
            model = self._get_model()
            settings = get_settings()
            target_dir = settings.report_dir / "segmentation"
            artifacts = model.generate_and_save_artifacts(
                image=image_path,
                output_dir=target_dir,
                prefix=f"upload_{upload_id}",
            )
        except (SegmentationError, Exception) as exc:
            logger.exception(f"Segmentation failed for upload {upload_id}: {str(exc)}")
            raise SegmentationServiceError(f"Segmentation pipeline failed: {str(exc)}") from exc

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return SegmentationResult(
            upload_id=upload_id,
            image_path=f"/media/uploads/{Path(upload.file_path).name}",
            segmentation_available=True,
            mask_available=True,
            predicted_region_ratio=artifacts["predicted_region_ratio"],
            threshold=artifacts["threshold"],
            mask_image_path=f"/media/segmentation/{artifacts['mask_filename']}",
            overlay_image_path=f"/media/segmentation/{artifacts['overlay_filename']}",
            interpretation="experimental_spatial_evidence",
            scientific_limitation="Predicted segmentation region ratio is experimental spatial evidence and is not equivalent to physical crop damage percentage.",
            processing_time_ms=round(elapsed_ms, 2),
        )

    def segment(self, upload_id: int, threshold: Optional[float] = None) -> SegmentationResult:
        """Convenience wrapper for execute."""
        return self.execute(upload_id=upload_id, threshold=threshold)
