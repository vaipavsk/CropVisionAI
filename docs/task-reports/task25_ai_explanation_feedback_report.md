# Task 25: AI Explanation Feedback (Grad-CAM) Implementation & Verification Report

**Project Title:** XAI-Driven Crop Damage Assessment from Farmer-Captured Images for Automated Insurance Claim Verification  
**Task ID:** TASK 25 — AI Explanation Feedback System  
**Date:** September 20, 2026  
**Status:** Complete (Ready for Final Review)

---

## 1. Executive Summary

Task 25 implemented an inspector-only AI Explanation Feedback subsystem for Grad-CAM heatmaps across the CropVisionAI platform. The system enables licensed agricultural insurance inspectors to critically evaluate whether the neural network's visual attention heatmaps (`features.8` layer of EfficientNet-B0) genuinely correspond to crop damage symptoms or spurious visual artifacts (e.g. soil background, leaf borders, lighting glare).

The feedback loop is strictly decoupled from automated claim adjudication and online model retraining, ensuring human-in-the-loop integrity and preventing uncalibrated automated decisions.

---

## 2. Supported Feedback Labels & Scientific Definitions

| Label | Definition | Inspection Criteria |
| :--- | :--- | :--- |
| `RELEVANT` | Heatmap accurately highlights the affected crop region. | The Grad-CAM gradient focus centers on visible disease lesions, discolored foliage, or damaged crop parts. |
| `PARTIALLY_RELEVANT` | Heatmap partly highlights the affected crop region. | The heatmap captures some lesion boundaries but also activates on adjacent healthy leaves or surrounding foliage. |
| `NOT_RELEVANT` | Heatmap does not appear to highlight the expected crop/damage region. | The gradient focus isolates background soil, shadows, camera artifacts, or unrelated non-foliar elements. |
| `UNABLE_TO_ASSESS` | The inspector cannot reliably assess the heatmap. | Low image quality, extreme blur, severe occlusion, or unclassifiable specimen prevents clear visual attribution. |

---

## 3. Architecture & Security Implementation

### Backend Architecture (`ai-service`)

1. **SQLAlchemy Data Model (`explanation_feedbacks`):**
   - Model: [`ExplanationFeedback`](file:///c:/Users/vipin/OneDrive/Documents/CropVisionAI/ai-service/app/models/explanation_feedback.py)
   - Unique Constraint: `UniqueConstraint("prediction_id", "inspector_id")` enforcing one idempotent feedback record per inspector per prediction.
   - Cascading foreign keys linked to `predictions.id`, `claims.id`, and `users.id`.
2. **REST Endpoints:**
   - `POST /claims/{claim_id}/feedback`: Records or updates inspector feedback.
   - `GET /claims/{claim_id}/feedback`: Retrieves feedback history for a claim.
3. **Role-Based Access Control (RBAC):**
   - Protected via `RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])`.
   - The `inspector_id` is extracted strictly from the server-verified Firebase JWT token and MySQL user context (`current_user.id`).
   - Farmers attempting access are rejected with `HTTP 403 Forbidden`.
   - Unauthenticated requests are rejected with `HTTP 401 Unauthorized`.

### Frontend Architecture (`frontend`)

1. **Interactive Feedback Component:**
   - Component: [`AIExplanationFeedback.jsx`](file:///c:/Users/vipin/OneDrive/Documents/CropVisionAI/frontend/src/components/inspector/AIExplanationFeedback.jsx)
   - Provides 4 styled radio rating cards with accessible ARIA semantics (`role="radiogroup"`, `role="radio"`, `aria-checked`).
   - Optional inspector comment box with character count limit ($2,000$ characters).
   - Saved feedback badge and previous submission audit trail (inspector name, email, timestamp, and comment).
   - Clear disclaimer text: *"Your feedback records your assessment of the Grad-CAM explanation. It does not automatically retrain the model or determine the insurance claim decision."*
2. **Workspace Integration:**
   - Embedded directly in [`InspectorInvestigationWorkspace.jsx`](file:///c:/Users/vipin/OneDrive/Documents/CropVisionAI/frontend/src/components/inspector/InspectorInvestigationWorkspace.jsx) beneath the Dual Specimen visual evidence panel and inside the tab switcher.
   - Integrated into the split-screen adjudication panel in [`InspectorDashboard.jsx`](file:///c:/Users/vipin/OneDrive/Documents/CropVisionAI/frontend/src/pages/Inspector/InspectorDashboard.jsx).

---

## 4. Test & Verification Results

### Backend Automated Unit Tests

* **Test Suite:** `ai-service/tests` (including [`test_explanation_feedback.py`](file:///c:/Users/vipin/OneDrive/Documents/CropVisionAI/ai-service/tests/test_explanation_feedback.py))
* **Command:** `..\venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`
* **Results:** **80 / 80 passed** ($0$ failures, $0$ errors) in $1.281\text{ s}$.

```text
Ran 80 tests in 1.281s
OK
```

### Coverage Breakdown:
1. `test_valid_feedback_labels`: Verified all 4 enum values (`RELEVANT`, `PARTIALLY_RELEVANT`, `NOT_RELEVANT`, `UNABLE_TO_ASSESS`).
2. `test_invalid_feedback_label_rejected`: Verified Pydantic validation error on unknown label strings.
3. `test_optional_comment_handling`: Verified `None`, empty, and non-empty string handling.
4. `test_farmer_cannot_submit_inspector_feedback`: Verified `HTTP 403 Forbidden` for farmer users.
5. `test_inspector_is_authorized`: Verified `HTTP 200` pass-through for inspector/admin roles.
6. `test_submit_feedback_relevant`: Verified payload serialization, db persistence, and response shape.
7. `test_submit_feedback_partially_relevant`: Verified partial relevance persistence.
8. `test_submit_feedback_not_relevant`: Verified non-relevance persistence.
9. `test_submit_feedback_unable_to_assess`: Verified inability to assess persistence.
10. `test_submit_feedback_upsert_existing_record`: Verified idempotent updates to existing feedback record.
11. `test_nonexistent_claim_returns_404`: Verified error handling for invalid claim IDs.
12. `test_claim_without_prediction_returns_404`: Verified error handling for orphan claims.
13. `test_claim_serialization_includes_feedback`: Verified serialized claim output includes `feedback` and `feedbacks`.
14. `test_claim_adjudication_independent_of_feedback`: Verified claim status remains independent of explanation ratings.

### Frontend Production Build

* **Command:** `npm run build`
* **Result:** **0 errors**, built in $474\text{ ms}$.

---

## 5. Live Browser Verification Summary

1. **Inspector Authentication & Navigation:**
   - Inspector signed in and navigated to `/inspector/dashboard`.
   - Claim review workspace opened displaying dual specimens (farmer's raw uploaded crop image + neural Grad-CAM attention overlay).
2. **AI Explanation Feedback Form:**
   - All 4 feedback rating cards displayed with distinct badges and descriptions.
   - Selected `RELEVANT` and entered inspector comment: *"Heatmap correctly highlights Septoria leaf spots."*
   - Clicked "Submit Feedback".
   - Verified feedback was recorded, displayed with `Assessment Saved: RELEVANT`, showing inspector name, updated timestamp, and comment.
3. **Idempotent Update:**
   - Modified rating and updated feedback seamlessly with reactive UI update.
4. **Farmer Portal Isolation:**
   - Confirmed farmer accounts cannot access or submit inspector explanation feedback.

---

## 6. Known Limitations & Future Scope

1. **Observational Subjectivity:** Inspector feedback records human perceptual quality of Grad-CAM heatmaps; it is not an automated pixel-level ground truth mask (such as IoU against annotated segmentation polygons).
2. **No Automatic Online Weight Updates:** Feedback is recorded as audit telemetry and dataset curation metadata; online retraining of EfficientNet-B0 requires offline review and batch retraining.
3. **No Automatic Claim Adjudication:** Heatmap ratings do not automatically trigger claim approval or rejection.
