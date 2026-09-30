from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application configuration loaded from environment variables and .env."""

    project_name: str = Field(default="CropVisionAI", alias="PROJECT_NAME")
    version: str = Field(default="1.0.0", alias="VERSION")
    mysql_host: str = Field(default="localhost", alias="MYSQL_HOST")
    mysql_port: int = Field(default=3306, alias="MYSQL_PORT")
    mysql_database: str = Field(default="cropvisionai", alias="MYSQL_DATABASE")
    mysql_user: str = Field(default="root", alias="MYSQL_USER")
    mysql_password: str = Field(default="password", alias="MYSQL_PASSWORD")
    upload_folder: str = Field(default="app/uploads", alias="UPLOAD_FOLDER")
    report_folder: str = Field(default="app/reports", alias="REPORT_FOLDER")
    yolo_model_path: str = Field(default="trained_models/yolov8n.pt", alias="YOLO_MODEL_PATH")
    efficientnet_model_name: str = Field(default="efficientnet_b0", alias="EFFICIENTNET_MODEL_NAME")
    # Do not silently use ImageNet labels for crop-disease inference.
    efficientnet_weights_path: str | None = Field(
        default="trained_models/efficientnet_b0_37class_candidate.pth",
        alias="EFFICIENTNET_WEIGHTS_PATH",
    )
    efficientnet_class_mapping_path: str = Field(
        default="trained_models/class_mapping.json",
        alias="EFFICIENTNET_CLASS_MAPPING_PATH",
    )
    segmentation_weights_path: str | None = Field(
        default="trained_models/segmentation/small_unet_best_val.pth",
        alias="SEGMENTATION_WEIGHTS_PATH",
    )
    segmentation_threshold: float = Field(default=0.5, alias="SEGMENTATION_THRESHOLD")
    yolo_confidence_threshold: float = Field(default=0.25, alias="YOLO_CONFIDENCE_THRESHOLD")
    low_damage_threshold: float = Field(default=15.0, alias="LOW_DAMAGE_THRESHOLD")
    moderate_damage_threshold: float = Field(default=70.0, alias="MODERATE_DAMAGE_THRESHOLD")
    high_damage_threshold: float = Field(default=70.0, alias="HIGH_DAMAGE_THRESHOLD")
    severe_damage_threshold: float = Field(default=90.0, alias="SEVERE_DAMAGE_THRESHOLD")
    debug: bool = Field(default=False, alias="DEBUG")

    # Security: CORS and Rate Limiting
    cors_allowed_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="CORS_ALLOWED_ORIGINS",
    )
    rate_limit_enabled: bool = Field(default=True, alias="RATE_LIMIT_ENABLED")
    rate_limit_upload_per_minute: int = Field(default=30, alias="RATE_LIMIT_UPLOAD_PER_MINUTE")
    rate_limit_predict_per_minute: int = Field(default=30, alias="RATE_LIMIT_PREDICT_PER_MINUTE")
    rate_limit_feedback_per_minute: int = Field(default=60, alias="RATE_LIMIT_FEEDBACK_PER_MINUTE")

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        """Return list of allowed CORS origins, preserving localhost by default."""
        if not self.cors_allowed_origins:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        if isinstance(self.cors_allowed_origins, list):
            return self.cors_allowed_origins
        origins = [orig.strip() for orig in self.cors_allowed_origins.split(",") if orig.strip()]
        return origins if origins else ["http://localhost:5173", "http://127.0.0.1:5173"]

    @property
    def upload_dir(self) -> Path:
        """Return the absolute upload directory path."""
        return self._resolve_path(self.upload_folder)

    @property
    def report_dir(self) -> Path:
        """Return the absolute report directory path."""
        return self._resolve_path(self.report_folder)

    @property
    def yolo_model_absolute_path(self) -> Path:
        """Return the absolute path to the YOLO model."""
        return self._resolve_path(self.yolo_model_path)

    @property
    def efficientnet_weights_absolute_path(self) -> Path | None:
        """Return the absolute path to the custom EfficientNet weights if configured."""
        if not self.efficientnet_weights_path:
            return None
        return self._resolve_path(self.efficientnet_weights_path)

    @property
    def efficientnet_class_mapping_absolute_path(self) -> Path:
        return self._resolve_path(self.efficientnet_class_mapping_path)

    @property
    def segmentation_weights_absolute_path(self) -> Path | None:
        """Return the absolute path to the Small U-Net segmentation weights if configured."""
        if not self.segmentation_weights_path:
            return None
        return self._resolve_path(self.segmentation_weights_path)

    def ensure_directories(self) -> None:
        """Create configured directories if they do not exist."""
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.report_dir.mkdir(parents=True, exist_ok=True)
        (self.report_dir / "segmentation").mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, value: str) -> Path:
        """Resolve a path relative to the service root."""
        path = Path(value)
        if not path.is_absolute():
            path = BASE_DIR / path
        return path


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""
    settings = Settings()
    settings.ensure_directories()
    return settings
