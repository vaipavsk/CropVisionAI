


# 🌾 CropVisionAI

## XAI-Driven Crop Damage Assessment from Farmer-Captured Images for Automated Insurance Claim Verification

CropVisionAI is an AI-powered web application designed to assist farmers, insurance inspectors, and claim verification teams in assessing crop damage from farmer-captured images.

The system combines computer vision, deep learning, and Explainable AI (XAI) to detect crop-related issues, classify diseases, estimate damage severity, assess risk, and provide an insurance recommendation.

---

## 🎯 Project Objective

Traditional crop insurance claim verification often depends on manual field inspections, which can be time-consuming, expensive, subjective, and difficult to scale.

CropVisionAI aims to provide an automated and explainable image-based assessment system that can assist the insurance verification process.

### The system provides:

- 🌱 Crop disease identification
- 🔍 Leaf / damaged-region detection
- 🧠 Deep-learning-based classification
- 📊 Damage severity analysis
- 🔥 Grad-CAM visual explanations
- ⚠️ Risk assessment
- 🛡️ Insurance recommendation
- 👨‍🌾 Farmer dashboard
- 🕵️ Inspector dashboard
- 📋 Prediction history

---

## 🏗️ System Architecture

```text
                    Farmer
                      │
                      ▼
              React Frontend
                      │
                      ▼
            Firebase Authentication
                      │
                      ▼
                FastAPI Backend
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
       YOLOv8              EfficientNet-B0
   Region Detection       Disease Classification
          │                       │
          └───────────┬───────────┘
                      │
                      ▼
                  Grad-CAM
              Explainable AI
                      │
                      ▼
              Severity Analysis
                      │
                      ▼
                Risk Assessment
                      │
                      ▼
          Insurance Recommendation
                      │
              ┌───────┼───────┐
              ▼       ▼       ▼
           Approve  Manual   Reject
                    Review
                      │
                      ▼
                   MySQL
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
   Farmer Dashboard       Inspector Dashboard
````

---

## 🧠 AI Processing Pipeline

```text
Farmer Upload
      ↓
Image Preprocessing
      ↓
YOLOv8
      ↓
Leaf / Damaged Region Detection
      ↓
EfficientNet-B0
      ↓
Crop + Disease Classification
      ↓
Grad-CAM
      ↓
Explainable Prediction
      ↓
Severity Analysis
      ↓
Risk Assessment
      ↓
Insurance Recommendation
```

---

## 🌾 Supported Crops

The current dataset focuses on five crops:

* 🌾 Rice
* 🍅 Tomato
* 🥔 Potato
* 🌽 Corn
* 🌶️ Bell Pepper

The prepared classification dataset contains:

* **37 disease/health classes**
* **56,002 images**

### Dataset Split

| Split      |     Images |
| ---------- | ---------: |
| Training   |     44,800 |
| Validation |      5,603 |
| Testing    |      5,599 |
| **Total**  | **56,002** |

Unsupported crop classes were excluded during automated dataset preparation.

---

## 🤖 Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Framer Motion
* Axios
* React Router

### Backend

* FastAPI
* Python
* SQLAlchemy
* MySQL

### Authentication

* Firebase Authentication
* Firebase ID Token / JWT Verification

### Artificial Intelligence

* YOLOv8
* EfficientNet-B0
* Grad-CAM
* OpenCV

### Development & Training

* Visual Studio Code
* Git
* GitHub
* Google Colab

---

## 🛡️ Insurance Recommendation Logic

CropVisionAI does not directly assign a fixed compensation amount.

Instead, the system follows an evidence-based decision flow:

```text
Disease
   ↓
Category
   ↓
Confidence
   ↓
Severity
   ↓
Risk Level
   ↓
Insurance Recommendation
   ↓
Reason
```

### Possible Recommendations

| Recommendation   | Meaning                                          |
| ---------------- | ------------------------------------------------ |
| ✅ Approve        | Evidence indicates the claim can proceed         |
| ⚠️ Manual Review | Additional human verification is required        |
| ❌ Reject         | Evidence does not sufficiently support the claim |

The system is designed to **assist insurance inspectors**, not replace final human verification.

---

## 🔥 Explainable AI with Grad-CAM

Explainability is a core component of CropVisionAI.

Grad-CAM is used to generate visual heatmaps showing the regions of the crop image that contributed most strongly to the model's classification decision.

This helps improve:

* Model transparency
* Inspector confidence
* Prediction verification
* Understanding of AI decisions
* Trust in automated assessment

Example workflow:

```text
Original Crop Image
        ↓
AI Prediction
        ↓
Grad-CAM
        ↓
Highlighted Important Regions
        ↓
Human Verification
```

---

## 📊 Dataset Preparation

The dataset is prepared automatically using Python scripts.

```text
scripts/
├── config.py
├── dataset_utils.py
└── prepare_dataset.py
```

The preparation pipeline performs:

* Dataset organization
* Crop filtering
* Class selection
* Image validation
* Train / validation / test splitting
* Duplicate filename handling
* Dataset statistics generation
* Dataset reporting

Generated reports include:

```text
dataset_report.md
dataset_statistics.csv
prepare_dataset.log
```

The complete dataset is intentionally **not stored in this GitHub repository** because it contains more than 56,000 images and is approximately 10 GB in size.

---

## 🧪 Backend Testing

The backend currently contains:

**40 / 40 tests passed ✅**

Testing covers:

* Prediction service
* Prediction router
* Recommendation engine
* Severity analysis
* YOLO detector
* Backend API functionality

---

## 📈 Model Evaluation

### EfficientNet-B0 Classification

The classification model will be evaluated using:

* Accuracy
* Precision
* Recall
* F1 Score
* Confusion Matrix
* Training Loss
* Validation Loss
* Accuracy Curves

### YOLOv8 Detection

The detection model will be evaluated using:

* Precision
* Recall
* mAP@50
* mAP@50-95

### Explainability

Grad-CAM outputs will be visually evaluated to verify that the highlighted regions correspond to relevant crop disease or damage areas.

---

## 🚀 Current Development Status

| Module                   |     Status     |
| ------------------------ | :------------: |
| Project Planning         |   ✅ Complete   |
| UI/UX Design             |   ✅ Complete   |
| Frontend Development     |      ✅ 95%     |
| Backend Development      |   ✅ Complete   |
| Authentication           |   ✅ Complete   |
| Upload System            |   ✅ Complete   |
| Prediction Pipeline      |   ✅ Complete   |
| Insurance Logic          |   ✅ Complete   |
| Farmer Dashboard         |   ✅ Complete   |
| Inspector Dashboard      |   ✅ Complete   |
| Dataset Collection       |   ✅ Complete   |
| Dataset Preparation      |   ✅ Complete   |
| EfficientNet-B0 Training | 🚧 In Progress |
| YOLOv8 Training          |   🚧 Planned   |
| Grad-CAM Integration     |   🚧 Planned   |
| AI Model Integration     |   🚧 Planned   |
| Final Testing            |   🚧 Planned   |
| Documentation            |   🚧 Planned   |

---

## 🔬 Model Training Strategy

Deep learning model training will be performed using **Google Colab** because it provides access to GPU acceleration and is suitable for long-running training workloads.

### EfficientNet-B0

Used for crop disease classification.

Planned output:

```text
best_classifier.pth
```

### YOLOv8

Used for leaf and damaged-region detection.

Planned output:

```text
best.pt
```

The trained models will be downloaded and integrated into the FastAPI AI service.

---

## 📁 Project Structure

```text
CropVisionAI/
│
├── ai-service/
│   ├── app/
│   │   ├── ai/
│   │   ├── database/
│   │   ├── dependencies/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── security/
│   │   ├── services/
│   │   └── utils/
│   │
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   └── public/
│
├── scripts/
│   ├── config.py
│   ├── dataset_utils.py
│   └── prepare_dataset.py
│
├── datasets/          # Local only
├── trained_models/    # Local / trained models
├── database/
├── docs/
│
├── .gitignore
└── README.md
```

---

## 🔐 Security

Sensitive credentials and large local resources are intentionally excluded from the repository.

Examples:

```text
.env
Firebase service-account credentials
datasets/
node_modules/
venv/
uploaded images
```

Never commit Firebase private keys, API secrets, database passwords, or other credentials to GitHub.

---

## 🗺️ Future Scope

Possible future enhancements include:

* 📱 Mobile application
* 🌾 Additional crop support
* 🌦️ Weather data integration
* 📍 GPS-based field verification
* 🛰️ Satellite imagery analysis
* 🚁 Drone-based crop assessment
* 🏢 Integration with real insurance providers
* 📄 Automated insurance claim report generation
* ☁️ Cloud-based deployment
* 🔄 Continuous model improvement

---

