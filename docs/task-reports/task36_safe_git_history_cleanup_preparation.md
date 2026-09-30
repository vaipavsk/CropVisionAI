# Task 36 — Safe Git History Cleanup Preparation Report

**Project:** CropVisionAI  
**Title:** XAI-Driven Crop Damage Assessment from Farmer-Captured Images for Automated Insurance Claim Verification  
**Task Date:** 2026-09-20  
**Final Status:** **`PREPARATION COMPLETE — AWAITING USER APPROVAL`**

---

## 1. Executive Summary

A comprehensive, non-destructive Git history cleanup preparation workflow was established.

Zero commits, pushes, history rewrites, tool installations, credential rotations, or file deletions were performed. All commands and procedures in this report are prepared for user review and approval prior to execution.

---

## 2. Repository State (Phase 1)

- **Active Branch:** `main`
- **Remote Configuration:** `origin https://github.com/vaipavsk/CropVisionAI.git` (fetch & push)
- **Latest Commit on `main`:** `87c1d5c (feat: update crop assessment and dataset pipeline)`
- **Working Tree State:** Contains verified application enhancements, tests, and documentation. `backend/.env` and `ai-service/.env` have been removed from the staging index (`git rm --cached`).

---

## 3. Safe Backup Requirements (Phase 2)

Prior to executing any Git history rewrite, a standalone mirror backup must be created outside the active working repository.

### Standalone Mirror Backup Command (Prepared for User Execution):
```bash
git clone --mirror "c:\Users\vipin\OneDrive\Documents\CropVisionAI" "c:\Users\vipin\OneDrive\Documents\CropVisionAI-backup.git"
```

### Why a Mirror Backup is Essential:
1. **Full Reference Preservation:** Preserves all branches, tags, stashes, and commit hashes verbatim.
2. **Outside Working Tree:** Ensures that history rewriting operations on the primary repository cannot corrupt or overwrite the backup.
3. **Instant Rollback Capability:** If any unexpected branch or tag corruption occurs during history filtering, the mirror clone can restore the repository completely.

---

## 4. Historical Cleanup Scope (Phase 3)

The exact target files identified in historical commits are:
- `backend/.env` (Committed in `1ef4738`)
- `ai-service/.env` (Committed in `23c970a` and `6ec6ca9`)

### Proposed History Rewriting Command via `git-filter-repo` (NOT EXECUTED):
```bash
# 1. Install tool (if not already installed)
pip install git-filter-repo

# 2. Execute path-specific historical purge
git filter-repo --invert-paths --path backend/.env --path ai-service/.env --force
```

### Why `git-filter-repo` is Preferred:
- Modern, officially recommended replacement for `git filter-branch` by the Git development team.
- High performance with Python-native stream processing.
- Strictly targets the specified `--path` arguments, leaving all source code, models, documentation, and commit messages intact.

---

## 5. Credential Safety & Manual Rotation Checklist (Phase 4)

| Step | Action Item | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **1** | Identify database credentials in historical `.env` files | Verified local MySQL development configurations | **Audit Complete** |
| **2** | Confirm external password reuse | Check if local password was used for production databases, cloud VMs, or remote accounts | **User Action Required** |
| **3** | Rotate credentials if reused externally | Update passwords on remote systems | **User Action Required** |
| **4** | Maintain local `.env` untracked | Verify `.gitignore` line 33 (`**/*.env`) excludes local `.env` | **Active & Verified** |
| **5** | Verify application database connectivity | Run `.\venv\Scripts\python test_firebase_live.py` | **Verified Functional** |

---

## 6. Post-Cleanup Verification Plan (Phase 5)

Once history rewriting is approved and executed, the following verification suite must be run:

1. **Verify Complete Purge of Historical Files:**
   ```bash
   git log --all --full-history -- "backend/.env" "ai-service/.env"
   ```
   *(Expected output: Completely empty).*

2. **Verify Integrity of Source Code & Tests:**
   ```bash
   python -m unittest discover -s tests -p "test_*.py" -v
   npm run build
   ```

3. **Verify Live Microservices:**
   ```bash
   python test_api_live.py
   python test_firebase_live.py
   ```

4. **Remote Force-Push (Only after verification):**
   ```bash
   git push origin main --force
   ```

---

## 7. Project Structure & Safety Check (Phase 6)

All critical directories and project files were verified intact:
- `README.md` (Consolidated root documentation)
- `docs/` (`task-reports`, `testing`, `security`, `ml-documentation`)
- `ai-service/` (Gateway, classification, Grad-CAM, YOLOv8, recommendation engine, tests)
- `backend/` (User/profile service, MySQL ORM models)
- `frontend/` (React SPA, Farmer Portal, Inspector Workspace)

---

## 8. Risks and Limitations

1. **Commit SHA Replacement:** History filtering alters all commit hashes from `1ef4738` forward.
2. **Collaborator Tree Rebase:** Anyone with an existing clone of the repository must re-clone or rebase their local copy against the new remote HEAD.
3. **Force-Push Requirement:** Pushing rewritten history to GitHub requires `git push origin main --force`.

---

## 9. User Approval Requirements

Before proceeding to execution, the user must explicitly approve:
1. Creation of the external mirror backup `CropVisionAI-backup.git`.
2. Execution of `git-filter-repo` to purge `backend/.env` and `ai-service/.env` from historical commits.
3. Subsequent `git push --force` to remote GitHub repository `vaipavsk/CropVisionAI`.

---

## 10. Final Recommendation

# **`PREPARATION COMPLETE — AWAITING USER APPROVAL`**

All preparation steps, exact command sequences, backup requirements, and verification protocols have been formulated and documented. The system is ready to proceed upon explicit user confirmation.
