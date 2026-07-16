from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RecommendationResult:
    """Contains the decision, risk, and manual review requirements of an insurance claim."""

    recommendation: str
    decision: str  # e.g., "APPROVE", "REJECT", "MANUAL_REVIEW"
    confidence: float  # confidence score [0.0, 1.0]
    fraud_risk: float  # fraud risk score [0.0, 1.0]
    requires_manual_review: bool
    reason: str
