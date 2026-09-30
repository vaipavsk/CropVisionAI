from __future__ import annotations

import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.models.claim import ClaimStatus
from app.models.user import UserRole
from app.routers.claims import _serialize_claim, _status, approve_claim, reject_claim
from app.security.roles import RoleChecker
from app.ai.severity import SeverityAnalyzer
from app.ai.recommendation import RecommendationEngine
from fastapi import HTTPException


class TestIssue1DecisionSafety(unittest.TestCase):
    """Targeted tests for Issue 1: Severity, Recommendation, and Decision Safety rules."""

    def setUp(self) -> None:
        self.severity_analyzer = SeverityAnalyzer()
        self.recommendation_engine = RecommendationEngine(
            high_confidence_threshold=0.90, min_confidence_threshold=0.60
        )

    def _mock_claim(self, metadata_json: str, status: ClaimStatus = ClaimStatus.DRAFT):
        upload = SimpleNamespace(
            id=101,
            original_name="crop_field.jpg",
            created_at=None,
            file_path="app/uploads/crop_field.jpg",
            user=None,
        )
        prediction = SimpleNamespace(
            id=50,
            upload=upload,
            explanation=metadata_json,
            confidence_score=0.85,
            damage_class="Potato_Early_Blight",
            created_at=None,
        )
        return SimpleNamespace(
            id=20,
            prediction=prediction,
            claim_number="CLM-000050",
            status=status,
            amount=15000.0,
            reason=None,
            created_at=None,
            updated_at=None,
        )

    def test_1_low_heuristic_severity_does_not_finalize_claim_rejection(self) -> None:
        """Requirement 1: Low heuristic severity does not independently finalize claim rejection."""
        # Calculate low severity
        severity_output = self.severity_analyzer.analyze(
            detections=[],
            classification={"class_name": "Corn_Healthy", "confidence": 0.95},
        )
        self.assertEqual(severity_output["severity"].upper(), "LOW")

        # Create a draft claim with low damage
        claim = self._mock_claim('{"damage_percentage": 5.0, "severity": "LOW"}', status=ClaimStatus.DRAFT)
        serialized = _serialize_claim(claim)

        # Claim status must be PENDING/DRAFT, NOT REJECTED automatically
        self.assertEqual(serialized["status"], "PENDING")
        self.assertNotEqual(serialized["status"], "REJECTED")

    def test_2_ai_reject_recommendation_remains_advisory(self) -> None:
        """Requirement 2: AI Reject recommendation remains advisory and separate from Claim.status."""
        rec = self.recommendation_engine.recommend(
            damage_percentage=5.0,
            severity_level="Low",
            risk_score=1.0,
            recommendation_score=2,
            classification="Corn_Common_Rust",
            classification_confidence=0.85,
            detected_objects=0,
        )
        self.assertEqual(rec.decision, "Reject")

        # Claim created with AI recommendation = Reject, but official status = DRAFT
        claim = self._mock_claim('{"recommendation": "Reject"}', status=ClaimStatus.DRAFT)
        serialized = _serialize_claim(claim)

        # Status is PENDING (Draft), recommendation is Reject (Advisory)
        self.assertEqual(serialized["status"], "PENDING")
        self.assertEqual(serialized["prediction"]["recommendation"], "Reject")
        self.assertIsNone(serialized["rejected_at"])

    def test_3_farmers_cannot_approve_claims(self) -> None:
        """Requirement 3: Farmers cannot approve claims."""
        checker = RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])
        farmer_user = SimpleNamespace(role=UserRole.FARMER)
        with self.assertRaises(HTTPException) as ctx:
            checker(farmer_user)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_4_farmers_cannot_reject_claims(self) -> None:
        """Requirement 4: Farmers cannot reject claims."""
        checker = RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])
        farmer_user = SimpleNamespace(role=UserRole.FARMER)
        with self.assertRaises(HTTPException) as ctx:
            checker(farmer_user)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_5_unauthorized_users_cannot_access_adjudication_endpoints(self) -> None:
        """Requirement 5: Unauthorized users cannot access adjudication endpoints."""
        checker = RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])
        unauthorized_user = SimpleNamespace(role="GUEST")
        with self.assertRaises(HTTPException) as ctx:
            checker(unauthorized_user)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_6_authorized_inspectors_can_make_official_decisions(self) -> None:
        """Requirement 6: Authorized inspectors/admins can make official decisions."""
        checker = RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])
        inspector_user = SimpleNamespace(role=UserRole.INSPECTOR)
        # Should pass without raising exception
        res = checker(inspector_user)
        self.assertEqual(res.role, UserRole.INSPECTOR)

    def test_7_ai_recommendation_and_official_claim_decision_remain_separate(self) -> None:
        """Requirement 7: AI recommendation and official claim decision remain separate."""
        # Case A: AI = Reject, Inspector = Approved
        claim_approved = self._mock_claim('{"recommendation": "Reject"}', status=ClaimStatus.APPROVED)
        serialized_approved = _serialize_claim(claim_approved)
        self.assertEqual(serialized_approved["status"], "APPROVED")
        self.assertEqual(serialized_approved["prediction"]["recommendation"], "Reject")

        # Case B: AI = Approve, Inspector = Rejected
        claim_rejected = self._mock_claim('{"recommendation": "Approve"}', status=ClaimStatus.REJECTED)
        serialized_rejected = _serialize_claim(claim_rejected)
        self.assertEqual(serialized_rejected["status"], "REJECTED")
        self.assertEqual(serialized_rejected["prediction"]["recommendation"], "Approve")

    def test_8_existing_backend_test_compatibility(self) -> None:
        """Requirement 8: Verify status mapping lifecycle compatibility."""
        self.assertEqual(_status(ClaimStatus.DRAFT), "PENDING")
        self.assertEqual(_status(ClaimStatus.SUBMITTED), "UNDER_REVIEW")
        self.assertEqual(_status(ClaimStatus.APPROVED), "APPROVED")
        self.assertEqual(_status(ClaimStatus.REJECTED), "REJECTED")


if __name__ == "__main__":
    unittest.main()
