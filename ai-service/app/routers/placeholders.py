from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("/auth")
def auth_placeholder() -> dict[str, str]:
    """Placeholder route for authentication module."""
    return {"message": "Authentication module placeholder"}


@router.get("/upload")
def upload_placeholder() -> dict[str, str]:
    """Placeholder route for image upload module."""
    return {"message": "Image upload module placeholder"}


@router.get("/yolo")
def yolo_placeholder() -> dict[str, str]:
    """Placeholder route for YOLO detection module."""
    return {"message": "YOLO detection module placeholder"}


@router.get("/efficientnet")
def efficientnet_placeholder() -> dict[str, str]:
    """Placeholder route for EfficientNet classification module."""
    return {"message": "EfficientNet classification module placeholder"}


@router.get("/gradcam")
def gradcam_placeholder() -> dict[str, str]:
    """Placeholder route for Grad-CAM module."""
    return {"message": "Grad-CAM module placeholder"}


@router.get("/reports")
def reports_placeholder() -> dict[str, str]:
    """Placeholder route for PDF report module."""
    return {"message": "PDF report module placeholder"}


@router.get("/dashboard")
def dashboard_placeholder() -> dict[str, str]:
    """Placeholder route for dashboard module."""
    return {"message": "Dashboard module placeholder"}
