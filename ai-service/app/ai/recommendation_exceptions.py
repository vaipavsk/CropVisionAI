from __future__ import annotations


class RecommendationError(Exception):
    """Base exception for all recommendation-related errors."""
    pass


class InvalidRecommendationInputError(RecommendationError, ValueError):
    """Exception raised when recommendation engine input values or formats are invalid."""
    pass
