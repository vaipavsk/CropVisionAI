# XAI-Driven Crop Damage Assessment from Farmer-Captured Images for Automated Insurance Claim Verification

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C.svg?logo=pytorch)](https://pytorch.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://reactjs.org)
[![Tests](https://img.shields.io/badge/Backend%20Tests-86%20Passed-brightgreen.svg)]()
[![Security](https://img.shields.io/badge/Security-RBAC%20%7C%20Rate%20Limited%20%7C%20Audited-blue.svg)]()

**CropVisionAI** is a deep learning and explainable artificial intelligence (XAI) platform designed to modernize agricultural crop damage assessment and insurance claim verification. By combining fine-grained computer vision classification, contextual object detection, Grad-CAM visual heatmaps, and a human-in-the-loop inspector portal, CropVisionAI provides transparent, tamper-resistant, and auditable damage evaluation for farmers and insurance adjudicators.

---

## Table of Contents

- [1. Problem Statement & Objectives](#1-problem-statement--objectives)
- [2. System Architecture](#2-system-architecture)
- [3. Key Features](#3-key-features)
- [4. Complete Technology Stack](#4-complete-technology-stack)
- [5. Machine Learning & Explainability Pipeline](#5-machine-learning--explainability-pipeline)
  - [Crop Disease Classifier (EfficientNet-B0)](#crop-disease-classifier-efficientnet-b0)
  - [Contextual Object Detection (YOLOv8)](#contextual-object-detection-yolov8)
  - [Grad-CAM Visual Saliency](#grad-cam-visual-saliency)
  - [Heuristic Severity & Advisory Engine](#heuristic-severity--advisory-engine)
  - [Academic Limitations & Governance](#academic-limitations--governance)
- [6. Application Workflow](#6-application-workflow)
- [7. Security, RBAC & Defense Controls](#7-security-rbac--defense-controls)
- [8. Repository Structure & Documentation](#8-repository-structure--documentation)
- [9. Local Setup & Installation Guide](#9-local-setup--installation-guide)
- [10. Testing & Verification Metrics](#10-testing--verification-metrics)
- [11. Future Roadmap](#11-future-roadmap)
- [12. License](#12-license)

---

## 1. Problem Statement & Objectives

### The Agricultural Insurance Challenge
Traditional crop damage assessment relies heavily on manual, on-site physical surveys conducted by insurance adjusters. This legacy workflow suffers from:
1. **Prolonged Turnaround Times:** Weeks or months between calamity occurrence and indemnity payout.
2. **Subjectivity & Inconsistency:** Variable human visual estimation across different surveyors.
3. **Fraud & Misrepresentation:** Inability to cryptographically verify image provenance or isolate anomalous submissions.
4. **Lack of Explainability:** "Black-box" automated scoring systems alienate farmers and adjusters by failing to visually justify decisions.

### Project Objectives
- **Automated AI Damage Assessment:** Deliver instant, fine-grained diagnosis across 37 crop disease classes spanning 5 major crop families.
- **Visual Explainability (XAI):** Generate pixel-level Grad-CAM heatmaps highlighting exact leaf lesion regions that drove the model's inference.
- **Heuristic Severity Scoring:** Quantify visual damage intensity into standardized risk tiers (`LOW`: 0%–15%, `MODERATE`: >15%–70%, `HIGH`: >70%–100%).
- **Decoupled Advisory Decision Support:** Provide automated recommendations (*Approve*, *Reject*, *Manual Review*) without stripping legal authority from human adjudicators.
- **Active Inspector Feedback Loop:** Enable insurance inspectors to rate Grad-CAM explanation fidelity (`RELEVANT`, `PARTIALLY_RELEVANT`, `NOT_RELEVANT`, `UNABLE_TO_ASSESS`) for continuous evaluation.
- **Enterprise-Grade Security:** Enforce cryptographic Firebase token authentication, database-level RBAC, input sanitization, in-memory rate limiting, and cross-user data isolation.

---

## 2. System Architecture

CropVisionAI is organized as a decoupled, microservice-inspired full-stack application:

```
                                  ┌───────────────────────────────┐
                                  │   React 18 / Vite Frontend    │
                                  │   (Farmer & Inspector UI)     │
                                  │   Port: 5173                  │
                                  └──────────────┬────────────────┘
                                                 │
                             HTTPS / Bearer JWT  │  (CORS Allowlisted)
                                                 ▼
            ┌────────────────────────────────────┴────────────────────────────────────┐
            │                                                                         │
            ▼                                                                         ▼
┌───────────────────────────────┐                         ┌────────────────────────────────────────┐
│  Backend Service (FastAPI)    │                         │  AI Core & Claims Service (FastAPI)    │
│  Port: 8001                   │                         │  Port: 8000                            │
├───────────────────────────────┤                         ├────────────────────────────────────────┤
│ • Firebase Auth Verification  │                         │ • 37-Class EfficientNet-B0 Classifier  │
│ • User Profile Synchronization│                         │ • YOLOv8 Object Detection              │
│ • Role Management & Self-Heal │                         │ • Thread-Safe Grad-CAM Saliency Engine │
│ • MySQL User Registry         │                         │ • Heuristic Severity & Rule Engine     │
└──────────────┬────────────────┘                         │ • Claims Adjudication & Media Routing  │
               │                                          │ • Inspector Feedback & Rate Limiting   │
               │                                          └───────────────────┬────────────────────┘
               │                                                              │
               └───────────────────────────────┬──────────────────────────────┘
                                               ▼
                                  ┌───────────────────────────────┐
                                  │      MySQL Relational DB      │
                                  │      (Port: 3306)             │
                                  ├───────────────────────────────┤
                                  │ • users                       │
                                  │ • uploads                     │
                                  │ • predictions                 │
                                  │ • claims                      │
                                  │ • explanation_feedbacks       │
                                  └───────────────────────────────┘
```

---

## 3. Key Features

### 🧑‍🌾 Farmer Portal
- **Secure Authentication & Profile Setup:** Google/Email authentication via Firebase with automatic self-healing MySQL profile synchronization.
- **High-Speed Specimen Upload:** Drag-and-drop image submission with client-side preview, validation, and $10\text{ MB}$ payload verification.
- **Real-Time AI Damage Diagnostics:** Immediate display of crop species, identified disease, confidence score, and advisory severity tier.
- **Visual Saliency Inspection:** Side-by-side view of original field image and Grad-CAM attention heatmap.
- **One-Click Claim Filing:** Automatic binding of AI diagnostic metadata, calculated loss amount, and rationale into an auditable claim.
- **Live Claim Tracker:** Real-time claim status tracking (`SUBMITTED`, `PENDING_INSPECTION`, `APPROVED`, `REJECTED`).

### 🔍 Inspector Portal
- **Role-Gated Adjudication Queue:** Dedicated triage dashboard filtering claims by severity, crop category, and adjudication status.
- **Deep Investigation Workspace:** Dual-specimen inspection comparing original farmer uploads with high-resolution Grad-CAM lesion heatmaps.
- **Advisory AI Insight Metrics:** Inspection of model confidence, detected contextual objects, and rule-based recommendation reasons.
- **Human-in-the-Loop Adjudication:** Formal claim approval or rejection with mandatory inspector rationale logging.
- **AI Explanation Feedback Mechanism:** Quantitative assessment of Grad-CAM relevance (`RELEVANT`, `PARTIALLY_RELEVANT`, `NOT_RELEVANT`, `UNABLE_TO_ASSESS`) with optional comments and idempotent upsert storage.
- **Audit PDF Export:** Client-side generation of comprehensive claim investigation summaries.

---

## 4. Complete Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Vanilla CSS Modules, Lucide React, Axios |
| **Backend Framework** | FastAPI (Python 3.10+ / 3.12+), Uvicorn, Pydantic v2, Pydantic-Settings |
| **Authentication & IAM** | Google Firebase Authentication, Firebase Admin Python SDK, HTTP Bearer JWTs |
| **Database & ORM** | MySQL 8.0, SQLAlchemy 2.0 ORM, PyMySQL, Cryptography |
| **Deep Learning & Vision** | PyTorch, Torchvision, Ultralytics YOLOv8n, OpenCV (`cv2`), Pillow (PIL), NumPy |
| **Explainable AI (XAI)** | Custom PyTorch Grad-CAM with forward/backward hook registration & thread safety |
| **Security & Utilities** | Starlette Middleware, In-Memory Sliding-Window Rate Limiter, ReportLab / html2canvas |

---

## 5. Machine Learning & Explainability Pipeline

```
  Farmer Image (JPG/PNG)
            │
            ▼
┌───────────────────────┐
│ Image Preprocessing   │ ──► [224x224 RGB, ImageNet Normalized]
└───────────┬───────────┘
            ├─────────────────────────────────────────┐
            ▼                                         ▼
┌───────────────────────────────┐         ┌───────────────────────┐
│ EfficientNet-B0 Classifier    │         │ YOLOv8 Context Object │
│ (37 Agricultural Classes)     │         │ Detector (Pretrained) │
└───────────┬───────────────────┘         └───────────┬───────────┘
            │                                         │
            ▼                                         ▼
┌───────────────────────────────┐         ┌───────────────────────┐
│ Grad-CAM Saliency Engine      │         │ Bounding Boxes &      │
│ (_gradcam_lock Protected)     │         │ Contextual Evidence   │
└───────────┬───────────────────┘         └───────────┬───────────┘
            │                                         │
            └────────────────────┬────────────────────┘
                                 ▼
                    ┌───────────────────────────┐
                    │ Heuristic Severity Engine │
                    │ & Advisory Decision Rules │
                    └────────────┬──────────────┘
                                 ▼
                     Advisory Recommendation
                   (Approve / Reject / Review)
```

### Crop Disease Classifier (EfficientNet-B0)
- **Base Architecture:** Transfer-learned `efficientnet_b0` backbone with custom classifier head fine-tuned on agricultural pathology datasets.
- **Output Classes:** 37 distinct categories across 5 crop species:
  - **Apple:** Scab, Black Rot, Cedar Apple Rust, Healthy
  - **Corn (Maize):** Cercospora Leaf Spot (Gray Leaf Spot), Common Rust, Northern Leaf Blight, Healthy
  - **Grape:** Black Rot, Black Measles (Esca), Leaf Blight (Isariopsis), Healthy
  - **Potato:** Early Blight, Late Blight, Healthy
  - **Tomato:** Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites (Two-Spotted Spider Mite), Target Spot, Tomato Yellow Leaf Curl Virus, Tomato Mosaic Virus, Healthy
  - *(Plus general healthy/background baseline categories)*
- **Verified Model Evaluation Metrics:**
  - **Unseen Real Test Set Accuracy:** **$97.65\%$** ($5,241$ real unseen test images)
  - **Macro Precision:** $0.9755$ | **Macro Recall:** $0.9800$ | **Macro F1-Score:** $0.9771$ | **Weighted F1-Score:** $0.9764$
  - **Validation Set Accuracy:** $99.40\%$ ($5,304$ real unseen validation images)
  - **Dataset Split:** $58,700$ training images ($43,604$ real + $15,096$ augmented), $5,304$ validation, $5,241$ test images.

### Contextual Object Detection (YOLOv8)
- **Model:** Ultralytics `yolov8n` running locally.
- **Role:** Contextual verification (detecting plant specimens, containers, or anomalies in the field frame).

### Grad-CAM Visual Saliency
- **Target Layer:** Final convolutional feature extraction stage (`features.8`).
- **Hook Mechanics:** Registers backward hooks to capture gradients of the top predicted class score with respect to target activation maps.
- **Thread Safety:** Protected via `_gradcam_lock = threading.Lock()` to prevent race conditions during concurrent multi-user gradient backpropagation.

### Heuristic Severity & Advisory Engine
The severity estimation pipeline classifies heuristic leaf damage according to the standardized project single source of truth:

| Damage Percentage | Severity |
|---|---|
| 0%–15% | LOW |
| >15%–70% | MODERATE |
| >70%–100% | HIGH |

- **Boundary Rules:** $0\%$ and $15\%$ map to `LOW`; $15.01\%$ and $70\%$ map to `MODERATE`; $70.01\%$ and $100\%$ map to `HIGH`.
- **Advisory Recommendation Rules:** Generates preliminary advisory recommendations (`Approve`, `Reject`, `Manual Review`) based on severity tiers and classification confidence thresholds. All AI recommendations remain strictly advisory.

### Academic Limitations & Governance
> [!IMPORTANT]
> **Academic & Operational Disclaimers:**
> 1. **YOLOv8n is Contextual:** YOLOv8n is currently a pretrained general detector and is not custom-trained as an agricultural lesion bounding-box detector.
> 2. **Severity is Heuristic:** Severity percentages represent image-level visual saliency density and do not measure physical acreage loss in kilograms/hectares.
> 3. **Grad-CAM Highlights Attribution:** Heatmaps visualize model focus areas, not absolute biological proof of pathogen presence.
> 4. **AI is Strictly Advisory:** Automated recommendations never directly approve, reject, or disburse insurance funds. Final adjudication authority resides exclusively with authorized human inspectors.
> 5. **Feedback Does Not Auto-Retrain:** Inspector feedback is stored as structured evaluation metadata and does not trigger automated weight updates in real-time.

---

## 6. Application Workflow

1. **Farmer Registration:** Farmer signs in via Firebase; backend creates or syncs local MySQL record with `FARMER` role.
2. **Specimen Upload:** Farmer submits crop photograph. Image format and integrity are validated; filename is sanitized with a random UUID.
3. **Inference Execution:** EfficientNet-B0 classifies the condition; YOLOv8 identifies objects; Grad-CAM generates the visual attention overlay.
4. **Advisory Scoring:** System computes severity index and advisory recommendation score.
5. **Claim Filing:** Farmer reviews diagnostic output and submits an insurance claim.
6. **Inspector Triage:** Insurance inspector reviews pending claims in the Inspector Workspace.
7. **Adjudication & Feedback:** Inspector reviews dual-specimen heatmaps, records Grad-CAM relevance rating, and issues final claim approval/rejection with rationale.

---

## 7. Security, RBAC & Defense Controls

| Control Area | Implementation Details |
| :--- | :--- |
| **Authentication** | Cryptographic verification of Firebase JWT tokens on every protected endpoint via `firebase_admin.auth.verify_id_token`. |
| **Authorization (RBAC)** | Role enforcement (`RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])`) verified against MySQL canonical records. Client-supplied role overrides are strictly rejected. |
| **SQL Injection Defense** | $100\%$ parameterized SQLAlchemy ORM queries (`db.query(Model).filter(...)`). Zero raw string interpolation. |
| **Upload Security** | Strict extension checks (`.jpg`, `.jpeg`, `.png`), PIL header verification, $10\text{ MB}$ size cap, UUID filename hashing, and path traversal rejection (`Path(name).name == name`). |
| **CORS Configuration** | Configurable origin allowlisting via `CORS_ALLOWED_ORIGINS` (supporting `http://localhost:5173` and `http://127.0.0.1:5173`) with `allow_credentials=True`. |
| **Rate Limiting** | Thread-safe sliding-window `InMemoryRateLimiter` protecting `/upload`, `/predict`, and `/feedback` endpoints against rapid bursts. |
| **Security Headers** | ASGI middleware injecting `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`. |
| **Secret Management** | All credentials read via `.env` / environment variables. `backend/.env` is completely untracked from Git. Sanitized templates (`.env.example`) provided. |
| **Production TLS** | Reverse proxy (NGINX/Cloudflare) is designated for production HTTPS termination and HSTS enforcement. |

---

## 8. Repository Structure & Documentation

```
CropVisionAI/
├── README.md                               # Canonical project documentation
├── .gitignore                              # Comprehensive version control ignore rules
│
├── backend/                                # FastAPI User Profile & Sync Service (Port 8001)
│   ├── main.py                             # Backend entrypoint with security headers & CORS
│   ├── .env.example                        # Sanitized configuration template
│   └── app/
│       ├── config/database.py              # SQLAlchemy engine & MySQL session lifecycle
│       ├── firebase_admin_init.py          # Firebase Admin SDK initialization
│       ├── models/user.py                  # User ORM model & UserRole enum
│       ├── routes/users.py                 # Registration & profile sync router
│       └── services/user_service.py        # Idempotent profile self-healing logic
│
├── ai-service/                             # FastAPI Deep Learning & Claims Service (Port 8000)
│   ├── run.py                              # Service launcher
│   ├── .env.example                        # Sanitized configuration template
│   ├── app/
│   │   ├── main.py                         # App factory, CORS allowlist, security headers
│   │   ├── config.py                       # Pydantic BaseSettings & threshold configuration
│   │   ├── ai/
│   │   │   ├── classifier.py               # 37-class EfficientNet-B0 inference engine
│   │   │   ├── detector.py                 # YOLOv8 object detector wrapper
│   │   │   ├── gradcam.py                  # Thread-safe PyTorch Grad-CAM implementation
│   │   │   ├── severity.py                 # Rule-based heuristic damage analyzer
│   │   │   └── recommendation.py           # Advisory insurance decision engine
│   │   ├── database/session.py             # Database session dependency
│   │   ├── dependencies/
│   │   │   ├── auth.py                     # Firebase Bearer token decoding
│   │   │   └── rate_limiter.py             # Thread-safe in-memory rate limiter
│   │   ├── models/                         # ORM Models (User, Upload, Prediction, Claim, Feedback)
│   │   ├── routers/                        # API Routers (Claims, Prediction, Upload, Media, Health)
│   │   └── services/                       # Prediction & upload orchestration services
│   ├── tests/                              # Unit & security test suite (86 tests)
│   └── trained_models/                     # Model weights & class mappings
│       ├── efficientnet_b0_37class_candidate.pth
│       ├── class_mapping.json
│       └── yolov8n.pt
│
├── frontend/                               # React 18 / Vite Web Portal (Port 5173)
│   ├── src/
│   │   ├── components/
│   │   │   ├── analysis/                   # Saliency viewer & metric cards
│   │   │   ├── claims/                     # Claim submission & review forms
│   │   │   ├── common/                     # GlassCard, Button, AuthorizedImage
│   │   │   ├── farmer/                     # Farmer metrics & upload zones
│   │   │   └── inspector/                  # Investigation workspace & AIExplanationFeedback
│   │   ├── pages/                          # FarmerDashboard, InspectorDashboard, Analysis
│   │   ├── services/                       # Authenticated API clients (api, claimApi, feedbackApi)
│   │   └── routes/AppRoutes.jsx            # Protected role-based routing
│   ├── package.json
│   └── vite.config.js
│
└── docs/                                   # Detailed academic, testing & security reports
    ├── task-reports/                       # Tasks 21–25 implementation & usability reports
    ├── security/                           # Task 26 Security Audit & Task 27 Remediation reports
    ├── testing/                            # Task 28 Final Diff & Regression report
    └── ml-documentation/                   # Dataset split, augmentation & training reports
```

---

## 9. Local Setup & Installation Guide

### Prerequisites
- Python 3.10+ or 3.12+
- Node.js 18+ and npm
- MySQL Server 8.0+ running on port `3306`
- Google Firebase Project (with Email/Password and Google Auth enabled)

### Step 1: Database Setup
Create the MySQL database:
```sql
CREATE DATABASE cropvisionai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Environment Configuration
1. In `backend/`, copy `.env.example` to `.env` and fill in your MySQL credentials:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. In `ai-service/`, copy `.env.example` to `.env`:
   ```bash
   cp ai-service/.env.example ai-service/.env
   ```
3. Place your Firebase Admin SDK service account private key JSON file in `ai-service/` (e.g. `ai-service/cropvisionai-firebase-adminsdk.json`).

### Step 3: Python Virtual Environment & Dependencies
```bash
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# source venv/bin/activate    # Linux / macOS

# Install dependencies
pip install -r ai-service/requirements.txt
```

### Step 4: Frontend Installation
```bash
cd frontend
npm install
cd ..
```

### Step 5: Launching Services
Run each service in a separate terminal:

- **Terminal 1: Backend Service (Port 8001)**
  ```bash
  cd backend
  ..\venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8001 --reload
  ```

- **Terminal 2: AI Core Service (Port 8000)**
  ```bash
  cd ai-service
  ..\venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```

- **Terminal 3: React Frontend (Port 5173)**
  ```bash
  cd frontend
  npm run dev
  ```

Access the application at `http://localhost:5173`.

---

## 10. Testing & Verification Metrics

CropVisionAI maintains an automated test suite covering classification, detection, saliency computation, rule evaluation, claims management, role security, rate limiting, and HTTP response headers.

### Automated Test Execution
```bash
cd ai-service
..\venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"
```

**Results:**
- **Total Backend Tests:** **86**
- **Passed:** **86 (100% Pass Rate)**
- **Failed:** **0** | **Errors:** **0**
- **Execution Time:** ~`1.7`–`4.2` seconds

### Frontend Build Validation
```bash
cd frontend
npm run build
```
**Results:** `✓ built in 2.44s` — 0 compilation errors, clean production bundle assets generated in `frontend/dist/`.

### Live Verification Suite
- **Live API & Token Verification:** `test_api_live.py` and `test_firebase_live.py` confirm Google certificate fetching, Bearer token verification, and rejection of unauthenticated requests.
- **Browser Portal Verification:** End-to-end verification of Farmer Specimen Submission, Claim Adjudication, and Grad-CAM Inspector Feedback submission.

---

## 11. Future Roadmap

1. **Custom Agricultural YOLOv8 Training:** Train a specialized YOLOv8 bounding box and segmentation model on field-captured crop disease lesions rather than general COCO objects.
2. **Real-World Farmer Image Robustness:** Incorporate diverse real-world mobile photography conditions (varying lighting, blur, complex backgrounds, occlusions).
3. **Distributed Rate Limiting:** Implement Redis-backed token bucket rate limiting (e.g. `slowapi` + Redis) for multi-worker containerized deployments.
4. **Automated Continuous Learning Pipeline:** Develop an offline pipeline leveraging validated inspector feedback metadata for active learning dataset curation.
5. **Mobile Application Integration:** Package client functionality into React Native or Flutter mobile applications for offline-first field capture.

---

## 12. License

This project is developed for academic and research purposes under the **MIT License**.
See the repository documentation for complete task logs and evaluation reports.
