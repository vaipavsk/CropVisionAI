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


class TestClaimSerialization(unittest.TestCase):
    def _claim(self, metadata: str | None, status: ClaimStatus = ClaimStatus.DRAFT):
        upload = SimpleNamespace(
            id=12,
            original_name="crop.jpg",
            created_at=None,
            file_path="app/uploads/crop.jpg",
            user=None,
        )
        prediction = SimpleNamespace(
            id=6,
            upload=upload,
            explanation=metadata,
            confidence_score=0.82,
            damage_class="Rice_Leaf_Blast",
            created_at=None,
        )
        return SimpleNamespace(
            id=4,
            prediction=prediction,
            claim_number="CLM-000006",
            status=status,
            amount=None,
            reason=None,
            created_at=None,
            updated_at=None,
        )

    def test_status_serialization_matches_claim_lifecycle(self) -> None:
        self.assertEqual(_status(ClaimStatus.DRAFT), "PENDING")
        self.assertEqual(_status(ClaimStatus.SUBMITTED), "UNDER_REVIEW")
        self.assertEqual(_status(ClaimStatus.APPROVED), "APPROVED")
        self.assertEqual(_status(ClaimStatus.REJECTED), "REJECTED")

    def test_farmer_role_is_rejected_from_inspector_routes(self) -> None:
        checker = RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])
        with self.assertRaises(HTTPException) as error:
            checker(SimpleNamespace(role=UserRole.FARMER))
        self.assertEqual(error.exception.status_code, 403)

    def test_missing_metadata_is_not_invented(self) -> None:
        payload = _serialize_claim(self._claim("{}"))
        prediction = payload["prediction"]
        self.assertIsNone(prediction["damage_percentage"])
        self.assertIsNone(prediction["risk_level"])
        self.assertIsNone(prediction["recommendation_reason"])
        self.assertIn("farmer", payload)
        self.assertEqual(payload["farmer"]["full_name"], "Unknown Farmer")

    def test_financial_amount_serialization_and_no_fake_payout_fields(self) -> None:
        claim = self._claim("{}")
        claim.amount = 25000.0
        payload = _serialize_claim(claim)
        
        self.assertEqual(payload["amount"], 25000.0)
        self.assertEqual(payload["claim_id"], "CLM-000006")
        
        # Verify no fake financial/bank settlement fields are added by the serializer
        self.assertNotIn("premium_amount", payload)
        self.assertNotIn("payout_amount", payload)
        self.assertNotIn("payment_status", payload)
        self.assertNotIn("policy_number", payload)
        self.assertNotIn("insurer_name", payload)
        self.assertNotIn("settlement_date", payload)
        self.assertNotIn("transaction_id", payload)

    def test_ai_recommendation_vs_inspector_decision_separation(self) -> None:
        # Case 1: AI recommendation = REJECT, Inspector decision = APPROVED
        claim1 = self._claim('{"recommendation": "Reject"}', status=ClaimStatus.APPROVED)
        payload1 = _serialize_claim(claim1)
        self.assertEqual(payload1["status"], "APPROVED")
        self.assertEqual(payload1["prediction"]["recommendation"], "Reject")

        # Case 2: AI recommendation = APPROVE, Inspector decision = REJECTED
        claim2 = self._claim('{"recommendation": "Approve"}', status=ClaimStatus.REJECTED)
        payload2 = _serialize_claim(claim2)
        self.assertEqual(payload2["status"], "REJECTED")
        self.assertEqual(payload2["prediction"]["recommendation"], "Approve")

        # Case 3: Matching decisions (AI = APPROVE, Inspector = APPROVED)
        claim3 = self._claim('{"recommendation": "Approve"}', status=ClaimStatus.APPROVED)
        payload3 = _serialize_claim(claim3)
        self.assertEqual(payload3["status"], "APPROVED")
        self.assertEqual(payload3["prediction"]["recommendation"], "Approve")

        # Case 4: Pending claim without Inspector decision (status = PENDING/DRAFT)
        claim4 = self._claim('{"recommendation": "Manual Review"}', status=ClaimStatus.DRAFT)
        payload4 = _serialize_claim(claim4)
        self.assertEqual(payload4["status"], "PENDING")
        self.assertEqual(payload4["prediction"]["recommendation"], "Manual Review")
        self.assertIsNone(payload4["approved_at"])
        self.assertIsNone(payload4["rejected_at"])


if __name__ == "__main__":
    unittest.main()
