# Task 35 — Credential Rotation & Git History Cleanup Planning Report

**Project:** CropVisionAI  
**Title:** XAI-Driven Crop Damage Assessment from Farmer-Captured Images for Automated Insurance Claim Verification  
**Task Date:** 2026-09-20  
**Final Status:** **`GIT HISTORY CLEANUP REQUIRED — USER APPROVAL REQUIRED`**

---

## 1. Executive Summary

A non-destructive security investigation was performed to assess the current environment configuration, historical Git commits containing `.env` records, potential credential reuse risks, and a safe Git history cleanup strategy.

No Git commit, Git push, Git history rewrite, credential rotation, or file deletion was executed. All sensitive values remain masked.

---

## 2. Current Environment File Status (Phase 1)

| Environment File | Disk Presence | Git Tracking Status | `.gitignore` Match | Finding |
| :--- | :--- | :--- | :--- | :--- |
| `backend/.env` | Exists locally | **Untracked** (Removed from staging index via `git rm --cached`) | Matched by line 33: `**/*.env` | Zero active tracking risk |
| `ai-service/.env` | Exists locally | **Untracked** (Removed from staging index via `git rm --cached`) | Matched by line 33: `**/*.env` | Zero active tracking risk |
| `backend/.env.example` | Exists | Tracked (Explicit template exception `!.env.example`) | Template only | Contains placeholders only |
| `ai-service/.env.example` | Exists | Tracked (Explicit template exception `!.env.example`) | Template only | Contains placeholders only |
| `frontend/.env.example` | Exists | Tracked | Template only | Contains placeholders only |

- **Firebase Service Account Files:** Zero active `.json` service-account files are tracked in Git index.

---

## 3. Historical Git Findings (Phase 2)

Historical Git log analysis confirmed that `.env` files were committed in earlier development milestones:

| Commit Hash | Milestone / Date | File Path | Secret Category | Historical Risk | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`1ef4738`** | Milestone 3: Image upload (2026-07-06) | `backend/.env` | Local MySQL database credentials | Historical commit contains local DB credentials | Rotate password if reused across other environments. |
| **`23c970a`** | Milestone 4: FastAPI backend (2026-07-09) | `backend/.env` | Local database configuration | Historical commit contains environment configuration | Scrub history prior to public repository release. |
| **`6ec6ca9`** | Milestone 4: Upload API (2026-07-13) | `backend/.env` | Local environment variables | Historical commit contains environment configuration | Scrub history prior to public repository release. |
| **`145e81b`** | Sprint 2: Firebase auth (2026-07-18) | `backend/.env` | Service account path string | Historical commit contains local service account path | Verify service account key private status. |

---

## 4. Credential Risk Assessment & Reuse (Phase 3)

- **Database Credentials:** The historical MySQL credentials appear to be standard local development values (`localhost`, port `3306`).
- **Reuse Assessment Status:** **`ROTATION NOT CURRENTLY INDICATED`** (Local-only development environment), with the caveat that if the local database password was ever reused on any external database, server, or cloud service, the user should rotate it on those external systems.
- **Firebase Private Keys:** The committed `.env` files contained filesystem path references to local service account files, not inline private keys.

---

## 5. Git History Cleanup Plan (Phase 4)

If this repository is intended for submission to a public GitHub repository or external distribution, historical commits should be purged of `.env` files.

### Step-by-Step Cleanup Procedure (Requires User Approval):

1. **Prerequisite - Create a Full Backup Archive:**
   ```bash
   git clone --mirror c:\Users\vipin\OneDrive\Documents\CropVisionAI c:\Users\vipin\OneDrive\Documents\CropVisionAI-backup.git
   ```

2. **Execute History Scrubbing via `git-filter-repo` (Python tool):**
   ```bash
   pip install git-filter-repo
   git filter-repo --invert-paths --path backend/.env --path ai-service/.env --force
   ```

3. **Verify Clean History:**
   ```bash
   git log --all --full-history -- "**.env*"
   ```
   *(Should return only `.env.example` templates).*

4. **Remote Force-Push (Only after user verification):**
   ```bash
   git push origin --force --all
   ```

> [!CAUTION]
> Force-pushing rewritten history replaces commit SHAs on the remote repository. Collaborators must re-clone or rebase their local working trees.

---

## 6. Security Configuration & Defense-in-Depth (Phase 5)

- **Authentication:** Firebase Admin RS256 token verification with public certificate caching.
- **Authorization:** `RoleChecker` canonical database role enforcement.
- **Data Isolation:** Multi-tenant claim scoping (`/claims/mine`).
- **Input Validation:** Magic byte validation via `PIL.Image`, $\le 10\text{ MB}$ limit, and UUID sanitization.
- **Network Defenses:** Origin whitelisting via `CORS_ALLOWED_ORIGINS` and defense-in-depth headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- **Concurrency & Resource Protection:** `_gradcam_lock` mutex and `torch.set_num_threads(4)`.

---

## 7. Non-Destructive Regression Test Results (Phase 6)

- **Backend Unit Test Suite:** `91` tests ran in `0.902s`, **`91 passed, 0 failed, 0 errors, 0 skipped`**.
- **Frontend Production Build:** `npm run build` executed in `388ms`, **`Exit Code: 0`**, $689$ modules transformed cleanly.

---

## 8. Files Modified During This Task

Zero application files or database tables were modified during Task 35.

---

## 9. Final Recommendation

# **`GIT HISTORY CLEANUP REQUIRED — USER APPROVAL REQUIRED`**

The repository is currently verified, healthy, and safe in its local working tree. Before making the repository publicly visible on GitHub, user approval is required to execute the non-destructive `git-filter-repo` history scrubbing workflow.
