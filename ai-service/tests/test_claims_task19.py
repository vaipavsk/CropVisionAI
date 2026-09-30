from __future__ import annotations

import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.models.claim import ClaimStatus
from app.models.user import UserRole
from app.routers.claims import _serialize_claim, _status
from app.security.roles import RoleChecker
from fastapi import HTTPException


class TestTask19MultiFarmerClaims(unittest.TestCase):
    def _create_mock_claim(
        self,
        claim_id: int,
        user_id: int,
        user_name: str,
        user_email: str,
        status: ClaimStatus = ClaimStatus.DRAFT,
        reason: str | None = None
    ):
        user = SimpleNamespace(
            id=user_id,
            full_name=user_name,
            email=user_email,
            role=UserRole.FARMER
        )
        upload = SimpleNamespace(
            id=100 + claim_id,
            original_name="crop_specimen.jpg",
            created_at=None,
            file_path=f"app/uploads/crop_{claim_id}.jpg",
            user=user
        )
        prediction = SimpleNamespace(
            id=200 + claim_id,
            upload=upload,
            explanation='{"damage_percentage": 45.0, "severity": "Moderate", "recommendation": "Manual Review"}',
            confidence_score=0.91,
            damage_class="Corn_Common_Rust",
            created_at=None
        )
        return SimpleNamespace(
            id=claim_id,
            prediction=prediction,
            claim_number=f"CLM-{claim_id:06d}",
            status=status,
            amount=15000.0,
            reason=reason,
            created_at=None,
            updated_at=None
        )

    def test_multi_farmer_claim_serialization_contains_farmer_identity(self) -> None:
        # Farmer A (Syed)
        claim1 = self._create_mock_claim(1, 3, "syed", "syed@gmail.com")
        payload1 = _serialize_claim(claim1)
        self.assertEqual(payload1["farmer"]["id"], 3)
        self.assertEqual(payload1["farmer"]["full_name"], "syed")
        self.assertEqual(payload1["farmer"]["email"], "syed@gmail.com")

        # Farmer B (Raja)
        claim2 = self._create_mock_claim(2, 16, "raja", "raja@gmail.com")
        payload2 = _serialize_claim(claim2)
        self.assertEqual(payload2["farmer"]["id"], 16)
        self.assertEqual(payload2["farmer"]["full_name"], "raja")
        self.assertEqual(payload2["farmer"]["email"], "raja@gmail.com")

        # Farmer C (Ravi)
        claim3 = self._create_mock_claim(3, 7, "ravi", "ravi@gmail.com")
        payload3 = _serialize_claim(claim3)
        self.assertEqual(payload3["farmer"]["id"], 7)
        self.assertEqual(payload3["farmer"]["full_name"], "ravi")
        self.assertEqual(payload3["farmer"]["email"], "ravi@gmail.com")

    def test_claim_status_mapping_consistency(self) -> None:
        self.assertEqual(_status(ClaimStatus.DRAFT), "PENDING")
        self.assertEqual(_status(ClaimStatus.SUBMITTED), "UNDER_REVIEW")
        self.assertEqual(_status(ClaimStatus.APPROVED), "APPROVED")
        self.assertEqual(_status(ClaimStatus.REJECTED), "REJECTED")

    def test_rejection_reason_field_serialization(self) -> None:
        claim = self._create_mock_claim(4, 16, "raja", "raja@gmail.com", status=ClaimStatus.REJECTED, reason="Image too blurry for disease verification")
        payload = _serialize_claim(claim)
        self.assertEqual(payload["status"], "REJECTED")
        self.assertEqual(payload["reason"], "Image too blurry for disease verification")

    def test_farmer_cannot_access_inspector_endpoints(self) -> None:
        checker = RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])
        farmer_user = SimpleNamespace(role=UserRole.FARMER)
        with self.assertRaises(HTTPException) as ctx:
            checker(farmer_user)
        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
