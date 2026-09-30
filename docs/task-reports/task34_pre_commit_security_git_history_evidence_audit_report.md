# Task 34 — Pre-Commit Security, Git History & Final Evidence Audit Report

**Project:** CropVisionAI  
**Title:** XAI-Driven Crop Damage Assessment from Farmer-Captured Images for Automated Insurance Claim Verification  
**Task Date:** 2026-09-20  
**Final Status:** **`VERIFIED WITH DOCUMENTED RISKS`**

---

## 1. Executive Summary

A strict pre-commit audit of Git working tree status, current secrets, historical commits, security configurations, ML training evidence, and severity consistency was executed across the **CropVisionAI** repository.

No Git commit or Git push operations were performed. All tests, build verifications, and non-destructive index cleansings were executed without exposing secret values or modifying model weights.

---

## 2. Git Working Tree Status (Phase 1)

- **Active Branch:** `main`
- **Git Index Cleanliness:** `backend/.env` and `ai-service/.env` have been removed from the Git index staging (`git rm --cached`).
- **Untracked Sensitive Files:** All local environment files (`.env`) are explicitly ignored by `.gitignore`.
- **Working Tree Changes:** Modified application files, consolidated root `README.md`, enhanced tests, and organized `docs/task-reports/` are preserved in the working tree for user review.

---

## 3. Current Secret and Credential Audit (Phase 2)

| File / Component | Verification Command | Finding | Current Risk Level |
| :--- | :--- | :--- | :--- |
| `backend/.env` | `git ls-files backend/.env` | **Untracked** in Git index | **Zero Current Risk** |
| `ai-service/.env` | `git ls-files ai-service/.env` | **Untracked** in Git index | **Zero Current Risk** |
| `.env.example` templates | Inspection of `backend/.env.example` & `ai-service/.env.example` | Contains placeholder keys only; zero real secrets | **Zero Risk** |
| Private Key Files (`.pem`, `.key`) | Glob pattern search | None tracked in Git index | **Zero Risk** |
| Firebase Service Account JSON | Glob pattern search | Excluded via `.gitignore` (`*firebase-adminsdk*.json`) | **Zero Current Risk** |

---

## 4. Historical Git Credential Audit (Phase 3)

An audit of earlier Git commits in the commit history was conducted without displaying secret values:

| Commit Hash | Commit Message / Date | Affected File(s) | Secret Category | Historical Risk Finding | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`1ef4738`** | Milestone 3: Image upload API completed (2026-07-06) | `backend/.env` | Local MySQL database credentials | Historical commit contains local DB credentials | If password was reused in production, rotate password. |
| **`23c970a`** | Milestone 4: Professional FastAPI architecture (2026-07-09) | `backend/.env` | Local configuration variables | Historical commit contains local configuration | Rotate credentials if shared. |
| **`6ec6ca9`** | Milestone 4: Upload API completed (2026-07-13) | `backend/.env` | Local environment variables | Historical commit contains environment variables | Scrub history before public repo release. |
| **`145e81b`** | Sprint 2: Complete Firebase auth integration (2026-07-18) | `backend/.env` | Firebase service account path | Historical commit contains service account path | Rotate Firebase service account if exposed. |

> [!WARNING]
> **Git History Scrubbing Recommendation:**  
> If this repository is ever published to a public GitHub repository, use `git-filter-repo` or `BFG Repo-Cleaner` to scrub `.env` files from the historical commit tree prior to making the repository public.

---

## 5. Security Configuration Findings (Phase 4)

1. **Firebase Authentication:** Validates RS256 JWT tokens against Google x509 public certificates with in-memory cert caching.
2. **Role-Based Access Control (RBAC):** Strict `RoleChecker` enforces `INSPECTOR` or `ADMIN` roles against canonical MySQL user records. Client-provided role parameters are rejected.
3. **Data Isolation:** Farmer claim queries (`/claims/mine`) are strictly scoped to `current_user.id`.
4. **File Validation:** Enforces magic byte verification via `PIL.Image`, file size $\le 10\text{ MB}$, and UUID filename sanitization.
5. **CORS Whitelist:** Configurable `CORS_ALLOWED_ORIGINS` allows `http://localhost:5173`; unauthorized origins receive `400 Bad Request`.
6. **Defense-in-Depth Headers:** Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
7. **Thread & Process Safety:** Grad-CAM backpropagation protected by `_gradcam_lock = threading.Lock()`; CPU thread limits set via `torch.set_num_threads(4)`.
8. **SQL Injection Defense:** $100\%$ parameterized SQLAlchemy ORM queries.

---

## 6. ML Metrics and Dataset Evidence Audit (Phase 5)

| Metric / Claim | Documented Claim | Verified Source Evidence | Audit Status |
| :--- | :--- | :--- | :--- |
| **Total Dataset Size** | $69,245$ images | `reports/model_training_report.md`, `reports/dataset_report.md` ($58,700$ train + $5,304$ val + $5,241$ test) | **`VERIFIED`** |
| **Class Distribution** | $37$ classes | `class_mapping.json` (37 distinct pathology and healthy categories) | **`VERIFIED`** |
| **Validation Accuracy** | $99.40\%$ | `model_training_report.md` ($5,304$ real unseen validation images) | **`VERIFIED`** |
| **Test Accuracy** | $97.65\%$ | `model_training_report.md` ($5,241$ real unseen test images, $0.9755$ Macro Prec, $0.9800$ Macro Recall, $0.9771$ Macro F1) | **`VERIFIED`** |
| **EfficientNet-B0 Backbone** | Transfer-learned | `ai-service/app/ai/classifier.py` | **`VERIFIED`** |
| **YOLOv8n Detector** | Pretrained contextual | `ai-service/app/ai/detector.py` | **`VERIFIED`** |
| **Grad-CAM Layer** | Final conv layer (`features.8`) | `ai-service/app/ai/gradcam.py` | **`VERIFIED`** |
| **Severity Heuristic** | 3-tier visual index | `ai-service/app/ai/severity.py` | **`VERIFIED`** |

---

## 7. Severity Consistency Audit (Phase 6)

$$\begin{aligned}
0\% \le \text{Damage} \le 15\% &\implies \mathbf{LOW} \\
15\% < \text{Damage} \le 70\% &\implies \mathbf{MODERATE} \\
70\% < \text{Damage} \le 100\% &\implies \mathbf{HIGH}
\end{aligned}$$

- **Boundary Matrix:** $0.0\%$ (`LOW`), $15.0\%$ (`LOW`), $15.01\%$ (`MODERATE`), $70.0\%$ (`MODERATE`), $70.01\%$ (`HIGH`), $100.0\%$ (`HIGH`) verified.
- **Obsolete Thresholds:** Confirmed zero active references to the obsolete $40\%$ threshold. All configuration files and `.env.example` templates standardized to $15.0$ and $70.0$.

---

## 8. Actual Test & Build Verification (Phase 7)

### A. Backend Unit Test Suite
- **Command:** `..\venv\Scripts\python -m unittest discover -s tests -p "test_*.py"`
- **Results:** **`91` tests passed, `0` failed, `0` errors, `0` skipped** in `4.140s`.

### B. Frontend Production Build
- **Command:** `npm run build`
- **Results:** **`✓ built in 452ms`** (Exit Code `0`, $0$ compilation errors, $689$ modules transformed).

### C. Live Scripts
- `test_api_live.py` $\rightarrow$ Passed (HTTP 200 health, 401 unauthenticated and invalid token rejections cleanly verified).
- `test_firebase_live.py` $\rightarrow$ Passed (Google x509 cert fetch: 200 OK, Firebase initialization: OK, MySQL ORM table checks: OK).

---

## 9. Documentation and Report Audit (Phase 8)

- **Root `README.md`:** Single consolidated README with accurate architecture diagrams, verified ML metrics, 3-tier severity table, and security matrices.
- **Task Reports in `docs/task-reports/`:** All reports preserved with accurate historical annotations.
- **Service Ports & Commands:** Standardized to Frontend `:5173`, AI Service `:8000`, User Backend `:8001`, MySQL `:3306`.

---

## 10. Issues Requiring User Action Prior to Public Release

1. **Local Credentials Rotation:** If the local database password used during development was ever reused on other systems, rotate it on those systems.
2. **Firebase Service Account:** Ensure the Firebase service account private key file is never checked into Git.
3. **Git History Scrubbing:** If publishing to a public repository, scrub commits `1ef4738`, `23c970a`, `6ec6ca9`, and `145e81b` using `git filter-repo`.

---

## 11. Remaining Operational Limitations

1. **In-Memory Rate Limiting:** Process-local memory rate limiter operates per worker. Horizontal scaling requires Redis.
2. **Reverse Proxy TLS:** Production HTTPS and HSTS termination rely on an external reverse proxy.
3. **Visual Saliency Heuristic:** Grad-CAM heatmaps and severity percentages are visual decision-support tools; final insurance adjudication belongs to authorized human inspectors.

---

## 12. Files Modified During Pre-Commit Tasks

- Staged index deletions: `backend/.env` and `ai-service/.env` removed from Git index.
- Configuration template: `ai-service/.env.example` updated to `MODERATE_DAMAGE_THRESHOLD=70.0`.
- Unit tests: `test_severity.py` and `test_recommendation.py` updated with exact boundary and backward-compatibility tests.
- Documentation: `README.md` and historical report annotations updated.

---

## 13. Final Recommendation

# **`VERIFIED WITH DOCUMENTED RISKS`**

The working tree is completely verified, all 91 tests pass, the production build succeeds with 0 errors, and all active environment files are untracked in Git. The repository is ready for the user to review and approve the final Git commit.
