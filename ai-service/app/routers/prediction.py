from __future__ import annotations

import logging
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.upload import Upload
from app.services.prediction_models import PredictionResponse
from app.services.prediction_service import PredictionService, PredictionServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["prediction"])


@router.post(
    "/{upload_id}",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
)
def predict_crop_damage(
    upload_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> PredictionResponse:
    """Run the orchestrated crop damage prediction pipeline on the uploaded image.

    Args:
        upload_id: Database ID of the upload.
        db: Database session.

    Returns:
        PredictionResponse: Standard API response wrapper containing the PredictionResult payload.
    """
    logger.info(f"Request received: POST /predict/{upload_id}")
    start_time = time.perf_counter()

    # 1. Validate upload_id (must be a positive integer)
    if upload_id <= 0:
        logger.error(f"Validation error: upload_id must be a positive integer. Got: {upload_id}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="upload_id must be a positive integer.",
        )

    # 2. Check if upload record exists
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        logger.error(f"Upload record not found: ID {upload_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload record with ID {upload_id} not found.",
        )

    # 3. Initialize prediction service and run the pipeline
    logger.info(f"Prediction started for upload ID: {upload_id}")
    service = PredictionService(db=db)

    try:
        result = service.predict(upload_id)
    except PredictionServiceError as exc:
        logger.exception(f"Prediction pipeline failed for upload ID: {upload_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction pipeline failed: {str(exc)}",
        ) from exc
    except Exception as exc:
        logger.exception(f"Unexpected exception during prediction pipeline for upload ID: {upload_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during prediction pipeline execution.",
        ) from exc

    execution_time_ms = (time.perf_counter() - start_time) * 1000.0
    logger.info(f"Prediction completed for upload ID {upload_id} in {execution_time_ms:.2f} ms")

    return PredictionResponse(
        success=True,
        message="Prediction completed successfully.",
        data=result,
    )
