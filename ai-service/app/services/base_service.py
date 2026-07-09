from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseService(ABC):
    """Base interface for all application services."""

    @abstractmethod
    def execute(self, *args: Any, **kwargs: Any) -> Any:
        """Run the service logic."""
        raise NotImplementedError
