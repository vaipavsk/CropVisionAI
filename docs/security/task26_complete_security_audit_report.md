# Task 26: Comprehensive Application & AI Security Review Report

**Project Title:** XAI-Driven Crop Damage Assessment from Farmer-Captured Images for Automated Insurance Claim Verification  
**Task ID:** Complete AI & System Security Review  
**Date:** September 20, 2026  
**Status:** Audit Completed — Standing by for Git Authorization  

---

## 1. Security Controls Verified

### A. Authentication & Role-Based Access Control (RBAC)
* **Cryptographic Token Verification:** All incoming requests to protected endpoints (`/claims`, `/claims/mine`, `/claims/{id}/feedback`, `/claims/{id}/approve`, `/claims/{id}/reject`, `/predict/{upload_id}`, `/upload`, `/media/uploads/{filename}`, `/media/heatmaps/{filename}`) are verified server-side using the official Google Firebase Admin SDK (`firebase_auth.verify_id_token(token)`).
* **Server-Derived Identity:** The `firebase_uid` and `email` claims are extracted strictly from the cryptographically verified JWT payload. Frontend-supplied user IDs or spoofed email headers are discarded.
* **Database Role Authority:** Role enforcement (`RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN])`) queries the canonical role stored in MySQL (`users` table).
* **Privilege Escalation Immunity:** A Farmer account cannot assign itself Inspector/Admin privileges on existing records. Idempotent registration endpoints (`POST /users/register`) return the existing stored profile and ignore client-submitted role alterations.
* **Farmer Data Isolation:**
  - `GET /claims/mine`: Filters strictly by `Upload.user_id == current_user.id`.
  - `POST /claims`: Enforces that the associated prediction's upload belongs to the authenticated claimant (`Upload.user_id == current_user.id`).
  - `/media/uploads/{filename}` and `/media/heatmaps/{filename}` verify ownership (`upload.user_id == user.id` or user is `INSPECTOR`/`ADMIN`) before streaming image bytes.

### B. Database Security & ORM Parameterization
* **SQL Injection Prevention:** 100% of database interactions in `backend` and `ai-service` utilize SQLAlchemy ORM mapped objects, relationship joins (`joinedload`), and parameterized queries (`db.query(Model).filter(...)`). No raw string interpolation exists in API endpoints.
* **Session Lifecycle & Resource Release:** Database connections are scoped to request lifecycles via FastAPI dependency generators (`get_db()`) with mandatory `finally: db.close()` cleanup.
* **Transaction Integrity & Rollbacks:** All write endpoints wrap database modifications in explicit `try ... db.commit() ... except ... db.rollback()` blocks, handling concurrency conflicts (`IntegrityError`) safely without leaving orphaned locks.
* **Relational Integrity & Unique Constraints:**
  - `users`: `UNIQUE (email)`, `UNIQUE (firebase_uid)`
  - `uploads`: `UNIQUE (file_name)`
  - `predictions`: `UNIQUE (upload_id)` (1-to-1)
  - `claims`: `UNIQUE (prediction_id)` (1-to-1)
  - `explanation_feedbacks`: `UNIQUE (prediction_id, inspector_id)` (Idempotent per inspector)

### C. File Upload Security & Path Traversal Prevention
* **Type & Signature Validation:** Uploads are validated against permitted extensions (`.jpg`, `.jpeg`, `.png`) and verified for image decodability using `PIL.Image.open().verify()` to mitigate malicious payload polyglots.
* **File Size Constraints:** Hard payload size cap enforced at $10\text{ MB}$ (`HTTP 413 Content Too Large`).
* **UUID Filename Sanitization:** Stored filenames are regenerated via `uuid.uuid4().hex + suffix`, stripping original client-provided filesystem names.
* **Path Traversal Shield:** Media router enforces `Path(filename).name == filename`, rejecting directory traversal sequences (`../`, `..\`, `%2e%2e`).

### D. AI Pipeline & Grad-CAM Concurrency Safety
* **Thread-Safe Saliency Computation:** Grad-CAM generation utilizes a global `threading.Lock()` during PyTorch forward/backward hook registration and gradient backpropagation, preventing race conditions or corrupted activations under concurrent multi-user load.
* **Inference Resource Protection:** Sequential inference is optimized for CPU execution (`torch.set_num_threads(2)`), preventing thread thrashing and memory spikes.
* **Corrupted Image Handling:** Corrupted or zero-dimension images are caught early with graceful HTTP error responses without crashing the Uvicorn worker process.
* **Academic & Decoupled Integrity:**
  - AI recommendations (`Approve`, `Reject`, `Manual Review`) are strictly advisory and never automatically modify claim records.
  - Grad-CAM heatmaps highlight model attribution and do not represent physical proof of damage.
  - Inspector explanation feedback is recorded as evaluation metadata and does not alter claim outcomes or trigger automated weight retraining.

---

## 2. Security Controls Partially Verified

* **CORS Configuration:**
  - `backend` (Port 8001): Scoped to `http://localhost:5173` and `http://127.0.0.1:5173` with `allow_credentials=True`. (Verified)
  - `ai-service` (Port 8000): Configured with `allow_origins=["*"]` with `allow_credentials=True`. While functional in local development, production deployment should restrict origins to the explicit frontend domain.

---

## 3. Security Controls Not Verified / Out of Local Scope

* **External Identity Provider Outages:** Resilience against Google Identity Platform downtime (handled via Firebase Admin token cache with upstream TTL).
* **Production HTTPS / TLS Termination:** Local verification was performed over `http://localhost`; production TLS termination and HSTS headers will be managed by the deployment reverse proxy (e.g. NGINX, Cloudflare).

---

## 4. Security Controls Not Implemented

* **API Application Rate Limiting:**
  - FastAPI services currently do not include in-memory or Redis-backed rate limiting middleware (e.g., `slowapi`).
  - *Mitigation Note:* Firebase Authentication provides client-side brute-force throttling (`auth/too-many-requests`), but backend prediction/upload endpoints currently rely on token authorization without per-minute request caps.

---

## 5. Actual Vulnerabilities & Risks Discovered

1. **Tracked Configuration File in Historical Git Commits:**
   - **File:** `backend/.env` is tracked in Git history (from early Sprint commit `1ef4738`).
   - **Risk:** Contains local development MySQL settings (`DB_PASSWORD`).
   - **Status:** The Firebase private key JSON file is **NOT** committed and is safely ignored in `.gitignore`.
   - **Remediation Recommendation:** Untrack `backend/.env` before publishing to public repositories and provide a sanitized `.env.example`.

---

## 6. Files Changed During Task 25 & Security Audit

| Subsystem | File Path | Status | Purpose |
| :--- | :--- | :--- | :--- |
| **AI Service** | `ai-service/app/models/explanation_feedback.py` | New | Model & enum for Grad-CAM feedback |
| **AI Service** | `ai-service/app/models/__init__.py` | Modified | Export feedback model |
| **AI Service** | `ai-service/app/models/prediction.py` | Modified | Added feedbacks relationship |
| **AI Service** | `ai-service/app/models/claim.py` | Modified | Added feedbacks relationship |
| **AI Service** | `ai-service/app/schemas/feedback.py` | New | Request & response schemas |
| **AI Service** | `ai-service/app/schemas/__init__.py` | Modified | Export feedback schemas |
| **AI Service** | `ai-service/app/routers/claims.py` | Modified | `POST`/`GET` feedback endpoints & serialization |
| **AI Service** | `ai-service/tests/test_explanation_feedback.py` | New | 14 dedicated security & unit tests |
| **Frontend** | `frontend/src/services/feedbackApi.js` | New | Authenticated feedback API client |
| **Frontend** | `frontend/src/components/inspector/AIExplanationFeedback.jsx` | New | Accessible feedback UI with disclaimer |
| **Frontend** | `frontend/src/components/inspector/InspectorInvestigationWorkspace.jsx` | Modified | Integrated feedback panel & tab |
| **Frontend** | `frontend/src/pages/Inspector/InspectorDashboard.jsx` | Modified | Integrated feedback in claim review panel |
| **Docs** | `README.md` | Modified | Updated feature specs and test metrics |
| **Docs** | `task25_ai_explanation_feedback_report.md` | New | Complete Task 25 report |

---

## 7. Tests Executed & Exact Results

### Automated Backend Tests
* **Command:** `..\venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`
* **Working Directory:** `ai-service`
* **Test Count:** **80 tests**
* **Results:** **80 Passed, 0 Failed, 0 Errors (100% Pass Rate)**
* **Execution Time:** `1.651s`

### Frontend Production Build
* **Command:** `npm run build`
* **Working Directory:** `frontend`
* **Result:** `✓ built in 2.44s` (0 errors, clean asset output)

### Live API & Browser Security Verification
* **Self-Healing Profile Sync:** Verified `POST /users/register` for inspector and farmer accounts.
* **Data Isolation:** Verified farmer accounts receive `HTTP 403 Forbidden` on inspector adjudication and feedback endpoints.
* **Ownership Enforcement:** Verified farmers cannot query or modify claims belonging to other accounts.

---

## 8. Remaining Security Risks & Hardening Recommendations

1. **Untrack `backend/.env`:** Remove `backend/.env` from git index (`git rm --cached backend/.env`) before pushing to public remote repositories.
2. **Production CORS Scoping:** In `ai-service/app/main.py`, replace `allow_origins=["*"]` with an environment variable referencing specific production frontend domain(s).
3. **Application Rate Limiting:** In future production phases, introduce `slowapi` or API gateway rate limiting on `/upload` and `/predict` endpoints (e.g. 10 requests/minute/user).

---

## 9. Conclusion & Readiness

* **Security Review Status:** **COMPLETE.**
* **Integrity:** Core RBAC, token verification, SQL injection protection, file upload sanitization, thread safety, and data isolation controls are fully operational and verified.
* **Repository State:** Clean, tested, uncommitted, and standing by for user confirmation.
