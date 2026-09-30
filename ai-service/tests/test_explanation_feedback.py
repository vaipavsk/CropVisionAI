from __future__ import annotations

import sys
import unittest
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import HTTPException
from pydantic import ValidationError

from app.models.claim import Claim, ClaimStatus
from app.models.explanation_feedback import ExplanationFeedback, ExplanationFeedbackLabel
from app.models.prediction import Prediction
from app.models.upload import Upload
from app.models.user import User, UserRole, UserStatus
from app.routers.claims import (
    _serialize_claim,
    _serialize_feedback,
    get_claim_explanation_feedback,
    submit_explanation_feedback,
)
from app.schemas.feedback import (
    ExplanationFeedbackCreate,
    ExplanationFeedbackData,
    ExplanationFeedbackResponse,
)
from app.security.roles import RoleChecker


class TestExplanationFeedbackUnit(unittest.TestCase):
    """Unit tests for Grad-CAM AI explanation feedback."""

    def setUp(self):
        self.inspector_user = User(
            id=10,
            firebase_uid="firebase_inspector_123",
            full_name="Jane Inspector",
            email="jane.inspector@cropvision.ai",
            role=UserRole.INSPECTOR,
            status=UserStatus.ACTIVE,
        )
        self.farmer_user = User(
            id=20,
            firebase_uid="firebase_farmer_456",
            full_name="John Farmer",
            email="john.farmer@cropvision.ai",
            role=UserRole.FARMER,
            status=UserStatus.ACTIVE,
        )

        self.upload = Upload(
            id=101,
            user_id=20,
            file_name="crop_sample.jpg",
            file_path="uploads/crop_sample.jpg",
            original_name="crop_sample.jpg",
        )
        self.upload.user = self.farmer_user

        self.prediction = Prediction(
            id=202,
            upload_id=101,
            model_name="EfficientNet-B0",
            confidence_score=0.94,
            damage_class="Rice_Leaf_Blast",
            explanation='{"severity": "Moderate", "recommendation": "Manual Review", "gradcam_image_path": "heatmaps/crop_sample_gradcam.png"}',
        )
        self.prediction.upload = self.upload

        self.claim = Claim(
            id=303,
            prediction_id=202,
            claim_number="CLM-000202",
            status=ClaimStatus.SUBMITTED,
            amount=15000.0,
            reason="Severe leaf blast damage observed across field.",
        )
        self.claim.prediction = self.prediction
        self.claim.feedbacks = []
        self.prediction.feedbacks = []

    # 1. Label Enum & Schema Validation Tests
    def test_valid_feedback_labels(self):
        """All 4 supported labels are valid."""
        for label in [
            ExplanationFeedbackLabel.RELEVANT,
            ExplanationFeedbackLabel.PARTIALLY_RELEVANT,
            ExplanationFeedbackLabel.NOT_RELEVANT,
            ExplanationFeedbackLabel.UNABLE_TO_ASSESS,
        ]:
            schema = ExplanationFeedbackCreate(feedback_label=label, comment="Inspection note")
            self.assertEqual(schema.feedback_label, label)

    def test_invalid_feedback_label_rejected(self):
        """Invalid feedback labels trigger validation error."""
        with self.assertRaises(ValidationError):
            ExplanationFeedbackCreate(feedback_label="HIGHLY_ACCURATE")  # invalid label

    def test_optional_comment_handling(self):
        """Comment is optional and defaults to None."""
        schema_none = ExplanationFeedbackCreate(feedback_label=ExplanationFeedbackLabel.RELEVANT)
        self.assertIsNone(schema_none.comment)

        schema_text = ExplanationFeedbackCreate(
            feedback_label=ExplanationFeedbackLabel.RELEVANT,
            comment="Grad-CAM accurately isolates blast lesions."
        )
        self.assertEqual(schema_text.comment, "Grad-CAM accurately isolates blast lesions.")

    # 2. Role Authorization Tests
    def test_farmer_cannot_submit_inspector_feedback(self):
        """Farmers are rejected with HTTP 403 Forbidden."""
        checker = RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])
        with self.assertRaises(HTTPException) as ctx:
            checker(self.farmer_user)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("authorization", ctx.exception.detail)

    def test_inspector_is_authorized(self):
        """Inspectors and Admins pass authorization."""
        checker = RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])
        user = checker(self.inspector_user)
        self.assertEqual(user.id, self.inspector_user.id)

    # 3. Endpoint logic: submit_explanation_feedback
    @patch("app.routers.claims._claim_query")
    def test_submit_feedback_relevant(self, mock_claim_query):
        """Valid submission with RELEVANT label and comment."""
        mock_claim_query.return_value.filter.return_value.first.return_value = self.claim
        
        mock_db = MagicMock()
        # db.query(ExplanationFeedback).filter().first() returns None (new feedback)
        # db.query(ExplanationFeedback).options().filter().first() returns created feedback
        fb_created = ExplanationFeedback(
            id=1,
            prediction_id=202,
            claim_id=303,
            inspector_id=10,
            feedback_label=ExplanationFeedbackLabel.RELEVANT,
            comment="Accurate focal point on lesion",
            created_at=datetime(2026, 9, 20, 10, 0, 0),
            updated_at=datetime(2026, 9, 20, 10, 0, 0),
        )
        fb_created.inspector = self.inspector_user
        
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = fb_created

        payload = ExplanationFeedbackCreate(
            feedback_label=ExplanationFeedbackLabel.RELEVANT,
            comment="Accurate focal point on lesion"
        )

        response = submit_explanation_feedback(
            claim_id=303,
            payload=payload,
            db=mock_db,
            current_user=self.inspector_user,
        )

        self.assertTrue(response["success"])
        self.assertEqual(response["data"]["feedback_label"], "RELEVANT")
        self.assertEqual(response["data"]["comment"], "Accurate focal point on lesion")
        self.assertEqual(response["data"]["inspector_id"], 10)
        self.assertEqual(response["data"]["inspector_name"], "Jane Inspector")
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @patch("app.routers.claims._claim_query")
    def test_submit_feedback_partially_relevant(self, mock_claim_query):
        """Valid submission with PARTIALLY_RELEVANT label."""
        mock_claim_query.return_value.filter.return_value.first.return_value = self.claim
        
        mock_db = MagicMock()
        fb_created = ExplanationFeedback(
            id=2,
            prediction_id=202,
            claim_id=303,
            inspector_id=10,
            feedback_label=ExplanationFeedbackLabel.PARTIALLY_RELEVANT,
            comment="Covers leaf border partially",
            created_at=datetime(2026, 9, 20, 10, 0, 0),
            updated_at=datetime(2026, 9, 20, 10, 0, 0),
        )
        fb_created.inspector = self.inspector_user
        
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = fb_created

        payload = ExplanationFeedbackCreate(
            feedback_label=ExplanationFeedbackLabel.PARTIALLY_RELEVANT,
            comment="Covers leaf border partially"
        )
        response = submit_explanation_feedback(
            claim_id=303,
            payload=payload,
            db=mock_db,
            current_user=self.inspector_user,
        )
        self.assertTrue(response["success"])
        self.assertEqual(response["data"]["feedback_label"], "PARTIALLY_RELEVANT")

    @patch("app.routers.claims._claim_query")
    def test_submit_feedback_not_relevant(self, mock_claim_query):
        """Valid submission with NOT_RELEVANT label."""
        mock_claim_query.return_value.filter.return_value.first.return_value = self.claim
        
        mock_db = MagicMock()
        fb_created = ExplanationFeedback(
            id=3,
            prediction_id=202,
            claim_id=303,
            inspector_id=10,
            feedback_label=ExplanationFeedbackLabel.NOT_RELEVANT,
            comment="Focused on background soil instead of leaf",
            created_at=datetime(2026, 9, 20, 10, 0, 0),
            updated_at=datetime(2026, 9, 20, 10, 0, 0),
        )
        fb_created.inspector = self.inspector_user
        
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = fb_created

        payload = ExplanationFeedbackCreate(
            feedback_label=ExplanationFeedbackLabel.NOT_RELEVANT,
            comment="Focused on background soil instead of leaf"
        )
        response = submit_explanation_feedback(
            claim_id=303,
            payload=payload,
            db=mock_db,
            current_user=self.inspector_user,
        )
        self.assertTrue(response["success"])
        self.assertEqual(response["data"]["feedback_label"], "NOT_RELEVANT")

    @patch("app.routers.claims._claim_query")
    def test_submit_feedback_unable_to_assess(self, mock_claim_query):
        """Valid submission with UNABLE_TO_ASSESS label."""
        mock_claim_query.return_value.filter.return_value.first.return_value = self.claim
        
        mock_db = MagicMock()
        fb_created = ExplanationFeedback(
            id=4,
            prediction_id=202,
            claim_id=303,
            inspector_id=10,
            feedback_label=ExplanationFeedbackLabel.UNABLE_TO_ASSESS,
            comment=None,
            created_at=datetime(2026, 9, 20, 10, 0, 0),
            updated_at=datetime(2026, 9, 20, 10, 0, 0),
        )
        fb_created.inspector = self.inspector_user
        
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = fb_created

        payload = ExplanationFeedbackCreate(
            feedback_label=ExplanationFeedbackLabel.UNABLE_TO_ASSESS
        )
        response = submit_explanation_feedback(
            claim_id=303,
            payload=payload,
            db=mock_db,
            current_user=self.inspector_user,
        )
        self.assertTrue(response["success"])
        self.assertEqual(response["data"]["feedback_label"], "UNABLE_TO_ASSESS")

    @patch("app.routers.claims._claim_query")
    def test_submit_feedback_upsert_existing_record(self, mock_claim_query):
        """Subsequent submission from same inspector updates existing record."""
        mock_claim_query.return_value.filter.return_value.first.return_value = self.claim
        
        existing = ExplanationFeedback(
            id=5,
            prediction_id=202,
            claim_id=303,
            inspector_id=10,
            feedback_label=ExplanationFeedbackLabel.PARTIALLY_RELEVANT,
            comment="Initial impression",
            created_at=datetime(2026, 9, 20, 9, 0, 0),
            updated_at=datetime(2026, 9, 20, 9, 0, 0),
        )
        existing.inspector = self.inspector_user

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = existing
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = existing

        payload = ExplanationFeedbackCreate(
            feedback_label=ExplanationFeedbackLabel.RELEVANT,
            comment="Updated assessment after closer inspection"
        )
        response = submit_explanation_feedback(
            claim_id=303,
            payload=payload,
            db=mock_db,
            current_user=self.inspector_user,
        )
        self.assertTrue(response["success"])
        self.assertEqual(existing.feedback_label, ExplanationFeedbackLabel.RELEVANT)
        self.assertEqual(existing.comment, "Updated assessment after closer inspection")
        # Ensure db.add was NOT called because it was an update
        mock_db.add.assert_not_called()
        mock_db.commit.assert_called_once()

    @patch("app.routers.claims._claim_query")
    def test_nonexistent_claim_returns_404(self, mock_claim_query):
        """Nonexistent claim ID returns 404 Not Found."""
        mock_claim_query.return_value.filter.return_value.first.return_value = None
        mock_db = MagicMock()

        payload = ExplanationFeedbackCreate(feedback_label=ExplanationFeedbackLabel.RELEVANT)
        with self.assertRaises(HTTPException) as ctx:
            submit_explanation_feedback(
                claim_id=9999,
                payload=payload,
                db=mock_db,
                current_user=self.inspector_user,
            )
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("Claim not found", ctx.exception.detail)

    @patch("app.routers.claims._claim_query")
    def test_claim_without_prediction_returns_404(self, mock_claim_query):
        """Claim with missing prediction returns 404."""
        orphan_claim = Claim(id=404, prediction_id=999, claim_number="CLM-000404")
        orphan_claim.prediction = None
        mock_claim_query.return_value.filter.return_value.first.return_value = orphan_claim
        mock_db = MagicMock()

        payload = ExplanationFeedbackCreate(feedback_label=ExplanationFeedbackLabel.RELEVANT)
        with self.assertRaises(HTTPException) as ctx:
            submit_explanation_feedback(
                claim_id=404,
                payload=payload,
                db=mock_db,
                current_user=self.inspector_user,
            )
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("No prediction record found", ctx.exception.detail)

    # 4. Serialization & Workflow Regression Tests
    def test_claim_serialization_includes_feedback(self):
        """Serialized claim payload includes feedback array and latest feedback."""
        fb = ExplanationFeedback(
            id=1,
            prediction_id=202,
            claim_id=303,
            inspector_id=10,
            feedback_label=ExplanationFeedbackLabel.RELEVANT,
            comment="Heatmap highlights damage correctly",
            created_at=datetime(2026, 9, 20, 10, 0, 0),
            updated_at=datetime(2026, 9, 20, 10, 0, 0),
        )
        fb.inspector = self.inspector_user
        self.claim.feedbacks = [fb]

        payload = _serialize_claim(self.claim)
        self.assertIn("feedback", payload)
        self.assertIn("feedbacks", payload)
        self.assertIsNotNone(payload["feedback"])
        self.assertEqual(payload["feedback"]["feedback_label"], "RELEVANT")
        self.assertEqual(payload["feedback"]["inspector_name"], "Jane Inspector")
        self.assertEqual(payload["feedback"]["comment"], "Heatmap highlights damage correctly")
        self.assertEqual(len(payload["feedbacks"]), 1)

    def test_claim_adjudication_independent_of_feedback(self):
        """AI Explanation Feedback does not alter claim status or force decisions."""
        self.claim.status = ClaimStatus.SUBMITTED
        payload = _serialize_claim(self.claim)
        self.assertEqual(payload["status"], "UNDER_REVIEW")

        # Adding NOT_RELEVANT feedback doesn't change claim status
        fb = ExplanationFeedback(
            id=2,
            prediction_id=202,
            claim_id=303,
            inspector_id=10,
            feedback_label=ExplanationFeedbackLabel.NOT_RELEVANT,
            comment="Heatmap missed target",
            created_at=datetime(2026, 9, 20, 10, 0, 0),
            updated_at=datetime(2026, 9, 20, 10, 0, 0),
        )
        self.claim.feedbacks = [fb]
        payload2 = _serialize_claim(self.claim)
        self.assertEqual(payload2["status"], "UNDER_REVIEW")
        self.assertEqual(payload2["feedback"]["feedback_label"], "NOT_RELEVANT")


if __name__ == "__main__":
    unittest.main()
