from __future__ import annotations

import logging
import time
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.claim import Claim, ClaimStatus
from app.models.prediction import Prediction, PredictionStatus
from app.models.upload import Upload
from app.services.base_service import BaseService
from app.services.prediction_models import PredictionResult

# Import AI modules
from app.ai.preprocess import ImagePreprocessor
from app.ai.detector import YOLODetector
from app.ai.classifier import EfficientNetClassifier
from app.ai.gradcam import GradCAMGenerator
from app.ai.severity import SeverityAnalyzer
from app.ai.recommendation import RecommendationEngine

logger = logging.getLogger(__name__)


def categorize_issue(issue_name: str) -> str:
    name_lower = issue_name.strip().lower()
    
    # Check for Healthy Crop
    if "healthy" in name_lower:
        return "Healthy Crop"
        
    # Check for Insect Pest Damage
    pest_keywords = [
        "hispa", "insect", "pest", "caterpillar", "aphid", "mite", "worm", 
        "borer", "beetle", "locust", "bug", "armyworm", "cutworm", "weevil", "thrip"
    ]
    if any(keyword in name_lower for keyword in pest_keywords):
        return "Insect Pest Damage"
        
    # Check for Bacterial Disease
    bacterial_keywords = ["bacterial", "canker", "scab (bacterial)"]
    if any(keyword in name_lower for keyword in bacterial_keywords):
        return "Bacterial Disease"
        
    # Check for Viral Disease
    viral_keywords = ["viral", "virus", "mosaic", "curl"]
    if any(keyword in name_lower for keyword in viral_keywords):
        return "Viral Disease"
        
    # Check for Nutrient Deficiency
    nutrient_keywords = ["deficiency", "nutrient", "chlorosis", "nitrogen", "potassium", "phosphorus"]
    if any(keyword in name_lower for keyword in nutrient_keywords):
        return "Nutrient Deficiency"
        
    # Check for Fungal Disease
    fungal_keywords = [
        "fungal", "blast", "rust", "blight", "septoria", "mildew", 
        "anthracnose", "scab", "spot", "smut", "rot", "mold"
    ]
    if any(keyword in name_lower for keyword in fungal_keywords):
        return "Fungal Disease"
        
    return "Unknown"


class PredictionServiceError(Exception):
    """Custom exception raised when the prediction pipeline fails at any stage."""
    pass


class PredictionService(BaseService):
    """Orchestrates the crop damage prediction pipeline by executing each AI module in order."""

    def __init__(self, db: Session) -> None:
        """Initialize the PredictionService.

        Args:
            db: Database session.
        """
        self.db = db

    def predict(self, upload_id: int) -> PredictionResult:
        """Run the automated AI prediction pipeline for an uploaded image.

        Args:
            upload_id: Database ID of the upload.

        Returns:
            PredictionResult: Structured result of the prediction pipeline.

        Raises:
            PredictionServiceError: If any pipeline module raises an exception or if the upload is not found.
        """
        return self.execute(upload_id)

    def execute(self, upload_id: int) -> PredictionResult:
        """Run the automated AI prediction pipeline for an uploaded image.

        Args:
            upload_id: Database ID of the upload.

        Returns:
            PredictionResult: Structured result of the prediction pipeline.

        Raises:
            PredictionServiceError: If any pipeline module raises an exception or if the upload is not found.
        """
        logger.info(f"Pipeline started for upload ID: {upload_id}")
        start_time = time.perf_counter()

        # 0. Retrieve Upload record
        upload = self.db.query(Upload).filter(Upload.id == upload_id).first()
        if not upload:
            err_msg = f"Upload record with ID {upload_id} not found in database."
            logger.error(err_msg)
            raise PredictionServiceError(err_msg)

        image_path = upload.file_path

        # Step 1: Image Preprocessor
        try:
            logger.info("Initializing ImagePreprocessor...")
            preprocessor = ImagePreprocessor()
            logger.info("Loading and validating image...")
            image_bgr = preprocessor.load_and_validate(image_path)
            logger.info("Preprocessing image...")
            image_rgb = preprocessor.preprocess(image_bgr)
            preprocessing_status = "SUCCESS"
            logger.info("Preprocessing completed successfully.")
        except Exception as exc:
            logger.exception("Pipeline failed during Image Preprocessing stage.")
            raise PredictionServiceError("Image preprocessing failed.") from exc

        # Step 2: YOLO Detector
        try:
            logger.info("Initializing YOLODetector...")
            detector = YOLODetector()
            logger.info("Running object detection...")
            detections = detector.detect(image_path)
            logger.info(f"Detection completed. Found {len(detections)} object(s).")
        except Exception as exc:
            logger.exception("Pipeline failed during YOLO Detection stage.")
            raise PredictionServiceError("Object detection failed.") from exc

        # Step 3: EfficientNet Classifier
        try:
            logger.info("Initializing EfficientNetClassifier...")
            classifier = EfficientNetClassifier()
            logger.info("Running crop classification...")
            classification_result = classifier.classify(image_rgb)
            logger.info(f"Classification completed: {classification_result['class_name']} ({classification_result['confidence']:.4f})")
        except Exception as exc:
            logger.exception("Pipeline failed during EfficientNet Classification stage.")
            raise PredictionServiceError("Crop classification failed.") from exc

        # Step 4: Grad-CAM Generator
        try:
            logger.info("Initializing GradCAMGenerator...")
            gradcam_generator = GradCAMGenerator()
            logger.info("Generating Grad-CAM explanation heatmap...")
            filename = f"gradcam_{upload_id}.jpg"
            gradcam_result = gradcam_generator.generate(
                model=classifier.model,
                image=image_rgb,
                class_index=classification_result["class_index"],
                confidence=classification_result["confidence"],
                filename=filename,
                preprocess=classifier.transforms,
            )
            gradcam_image_path = gradcam_result["heatmap_path"]
            logger.info(f"Grad-CAM completed. Heatmap saved to: {gradcam_image_path}")
        except Exception as exc:
            logger.exception("Pipeline failed during Grad-CAM Heatmap Generation stage.")
            raise PredictionServiceError("Grad-CAM generation failed.") from exc

        # Step 5: Severity Analyzer
        try:
            logger.info("Initializing SeverityAnalyzer...")
            severity_analyzer = SeverityAnalyzer()
            logger.info("Running crop damage severity analysis...")
            severity_result = severity_analyzer.analyze(
                detections=detections,
                classification=classification_result,
            )
            logger.info(f"Severity completed: level={severity_result['severity']}, percentage={severity_result['damage_percentage']}, risk={severity_result['risk_score']:.2f}")
        except Exception as exc:
            logger.exception("Pipeline failed during Severity Analysis stage.")
            raise PredictionServiceError("Severity analysis failed.") from exc

        # Step 6: Insurance Recommendation Engine
        try:
            logger.info("Initializing RecommendationEngine...")
            recommendation_engine = RecommendationEngine()
            logger.info("Generating insurance claim recommendation...")
            rec_result = recommendation_engine.recommend(
                damage_percentage=severity_result["damage_percentage"],
                severity_level=severity_result["severity"],
                risk_score=severity_result["risk_score"],
                recommendation_score=severity_result["recommendation_score"],
                classification=classification_result["class_name"],
                classification_confidence=classification_result["confidence"],
                detected_objects=detections,
            )
            logger.info(f"Recommendation completed: decision={rec_result.decision}, fraud_risk={rec_result.fraud_risk:.2f}")
        except Exception as exc:
            logger.exception("Pipeline failed during Insurance Recommendation stage.")
            raise PredictionServiceError("Insurance recommendation failed.") from exc

        # Pipeline complete: compute total execution time in milliseconds
        end_time = time.perf_counter()
        processing_time_ms = (end_time - start_time) * 1000.0
        logger.info(f"Pipeline completed successfully in {processing_time_ms:.2f} ms.")

        # Compute category and risk level
        category = categorize_issue(classification_result["class_name"])
        damage_pct = severity_result["damage_percentage"]
        sev_tier = severity_result.get("severity", "LOW")
        if sev_tier in ("HIGH", "SEVERE"):
            risk_lvl = "High"
        elif sev_tier == "MODERATE":
            risk_lvl = "Medium"
        else:
            risk_lvl = "Low"

        result = PredictionResult(
            upload_id=upload_id,
            image_path=image_path,
            preprocessing_status=preprocessing_status,
            detections=detections,
            classification=classification_result["class_name"],
            classification_confidence=classification_result["confidence"],
            damage_percentage=damage_pct,
            severity=severity_result["severity"],
            severity_score=severity_result["risk_score"],
            gradcam_image_path=gradcam_image_path,
            insurance_recommendation=rec_result.decision,
            fraud_risk=rec_result.fraud_risk,
            category=category,
            risk_level=risk_lvl,
            recommendation_reason=rec_result.reason,
            processing_time_ms=processing_time_ms,
            timestamp=datetime.now(timezone.utc),
            pipeline_status="COMPLETED",
        )
        self._persist_prediction_and_claim(upload, result)
        return result

    def _persist_prediction_and_claim(self, upload: Upload, result: PredictionResult) -> None:
        """Persist inference output without allowing an optional claim failure to fail AI inference."""
        metadata = {
            "severity": result.severity,
            "severity_score": result.severity_score,
            "damage_percentage": result.damage_percentage,
            "recommendation": result.insurance_recommendation,
            "gradcam_image_path": result.gradcam_image_path,
            "timestamp": result.timestamp.isoformat(),
            "category": result.category,
            "risk_level": result.risk_level,
            "recommendation_reason": result.recommendation_reason,
            "detections_count": len(result.detections),
        }
        try:
            prediction = self.db.query(Prediction).filter(Prediction.upload_id == upload.id).first()
            if prediction is None:
                prediction = Prediction(
                    upload_id=upload.id,
                    model_name="YOLOv8 + EfficientNet-B0",
                    confidence_score=result.classification_confidence,
                    damage_class=result.classification,
                    explanation=json.dumps(metadata),
                    status=PredictionStatus.COMPLETED,
                )
                self.db.add(prediction)
            else:
                prediction.model_name = "YOLOv8 + EfficientNet-B0"
                prediction.confidence_score = result.classification_confidence
                prediction.damage_class = result.classification
                prediction.explanation = json.dumps(metadata)
                prediction.status = PredictionStatus.COMPLETED

            self.db.commit()
            self.db.refresh(prediction)
            logger.info("Prediction persisted: prediction_id=%s upload_id=%s", prediction.id, upload.id)
        except Exception as exc:
            self.db.rollback()
            logger.exception("Prediction persistence failed for upload_id=%s", upload.id)
            raise PredictionServiceError("Prediction persistence failed.") from exc

        try:
            claim = self.db.query(Claim).filter(Claim.prediction_id == prediction.id).first()
            if claim is None:
                claim = Claim(
                    prediction_id=prediction.id,
                    claim_number=f"CLM-{prediction.id:06d}",
                    status=ClaimStatus.DRAFT,
                )
                self.db.add(claim)
                self.db.commit()
                self.db.refresh(claim)
                logger.info("Claim created: claim_id=%s prediction_id=%s upload_id=%s", claim.id, prediction.id, upload.id)
            else:
                logger.info("Claim already exists: claim_id=%s prediction_id=%s", claim.id, prediction.id)
        except Exception:
            # The prediction commit above has already completed. Claim failures must never
            # turn a completed farmer inference into an interrupted pipeline response.
            self.db.rollback()
            logger.exception("Claim creation failed for prediction_id=%s; prediction remains saved", prediction.id)
