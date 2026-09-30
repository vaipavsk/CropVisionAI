# Experimental PlantSeg Small U-Net Segmentation Capability

**Project:** CropVisionAI  
**Component:** Auxiliary / Experimental Spatial Segmentation Branch  
**Status:** Experimental Preliminary Capability  

---

## 1. Overview & Architecture

CropVisionAI incorporates a separately trained **Small U-Net** binary segmentation model trained to segment symptomatic/affected crop regions in RGB images.

> [!IMPORTANT]
> **Scientific Limitation Notice:**
> **"Predicted segmentation region ratio is experimental spatial evidence and is not equivalent to physical crop damage percentage."**
> This model predicts annotated affected regions and MUST NOT be used for direct crop yield loss estimation, insurance claim underwriting, or financial compensation calculations.

### Production Separation Invariant
The production crop disease assessment pipeline is strictly separate from this experimental segmentation capability:
- **EfficientNet-B0**: 37-class disease classification (97.65% test accuracy) $\rightarrow$ Confidence $\rightarrow$ Agronomic Knowledge Base $\rightarrow$ Domain-Informed Categorical Severity (`LOW` / `MODERATE` / `HIGH` / `INSUFFICIENT_EVIDENCE`) $\rightarrow$ Claim Triage Recommendation.
- **Small U-Net**: Auxiliary experimental segmentation producing binary foreground masks and `predicted_region_ratio` without altering categorical severity, risk scores, or insurance recommendation logic.

---

## 2. Model Specifications

- **Checkpoint Filename:** `small_unet_best_val.pth`
- **Checkpoint Location:** `ai-service/trained_models/segmentation/small_unet_best_val.pth`
- **Architecture:** Small U-Net
  - **Input Channels:** 3 (RGB)
  - **Output Channels:** 1 (Binary mask logit)
  - **Base Channels:** 16 (Channels: 16 $\rightarrow$ 32 $\rightarrow$ 64 $\rightarrow$ 128 Bottleneck $\rightarrow$ 64 $\rightarrow$ 32 $\rightarrow$ 16 $\rightarrow$ 1)
  - **Conv Blocks:** Conv2d(bias=False) $\rightarrow$ BatchNorm2d $\rightarrow$ ReLU(inplace=True) $\rightarrow$ Conv2d(bias=False) $\rightarrow$ BatchNorm2d $\rightarrow$ ReLU(inplace=True)
  - **Downsampling:** MaxPool2d(2)
  - **Upsampling:** ConvTranspose2d(stride=2) + Skip Concatenation
- **Input Resolution:** $256 \times 256$ pixels (RGB, normalized to $[0.0, 1.0]$)
- **Output Resolution:** $256 \times 256$ pixels (Single channel probability map via Sigmoid)
- **Inference Discretization Threshold:** $0.5$ (configurable)

---

## 3. Training & Validation Benchmark

- **Trained Epochs:** 10 (Adam optimizer, lr=0.001, Batch size=4, BCE + Dice Loss)
- **Best Validation Metrics (Epoch 10):**
  - Validation Dice: `0.542358`
  - Validation IoU: `0.405728`
  - Validation Loss: `0.898890`
- **Independent Test Set Results (295 samples):**
  - Test Dice: `0.519137`
  - Test IoU: `0.382720`
  - Test Precision: `0.492362`
  - Test Recall: `0.711375`
  - Area MAE: `12.3612` percentage points
  - Pearson Correlation: `0.529927`
  - Spearman Correlation: `0.534491`
  - Over-segmentation Tendency: `216/295` (73.22%)

---

## 4. API Endpoints

### 1. Run Segmentation Inference
- **Endpoint:** `POST /segmentation/{upload_id}`
- **Query Parameters:** `threshold` (optional float in $[0.0, 1.0]$, default: `0.5`)
- **Authorization:** Authenticated User (Farmer for own uploads, Inspector, Admin)
- **Response Structure:**
```json
{
  "success": true,
  "message": "Experimental plant segmentation completed successfully.",
  "data": {
    "upload_id": 123,
    "image_path": "/media/uploads/upload_123.jpg",
    "segmentation_available": true,
    "mask_available": true,
    "predicted_region_ratio": 0.1852,
    "threshold": 0.5,
    "mask_image_path": "/media/segmentation/upload_123_mask_a1b2c3d4.png",
    "overlay_image_path": "/media/segmentation/upload_123_overlay_a1b2c3d4.jpg",
    "interpretation": "experimental_spatial_evidence",
    "scientific_limitation": "Predicted segmentation region ratio is experimental spatial evidence and is not equivalent to physical crop damage percentage.",
    "processing_time_ms": 42.15
  }
}
```

### 2. Media Retrieval
- **Endpoint:** `GET /media/segmentation/{filename}`
- **Authorization:** Authenticated User (Upload owner, Inspector, Admin)
- **Content-Type:** `image/png` (binary mask) or `image/jpeg` (overlay visualization)

---

## 5. Test Status & Regression

All segmentation capabilities are validated in `ai-service/tests/test_segmentation.py`:
- Checkpoint integrity & CPU loading
- Strict parameter matching with state_dict
- RGB preprocessing scaling & shapes
- Logit & Sigmoid output bounds
- Binary discretization thresholding
- Bounded foreground ratio computation
- Missing checkpoint & malformed input exception handling
- API authentication, authorization, and 404/422/403/200 contract verification
- **Overall AI service test suite:** 103/103 tests passing.
