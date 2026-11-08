# WORKING SET

- 2026-11-08: Real Geometric Pose Verification & 200+ Employee Scalable Duplicate Engine
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (Exact geometric jaw-to-nose `yaw` ratio, vertical `pitch` ratio, lip corner `isSmiling` detector; duplicate check with `masterDist <= 0.35 && minVectorDist <= 0.30` and case-insensitive self-skip)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (~0.9s steady hold +20%/frame, live pose guidance feedback, instant 1-click 'Reassign / Overwrite' biometrics button)
  - Issue Diagnosed: Pose verification previously had trivial thresholds (0.02) which caused all poses to auto-complete without moving. Duplicate check previously triggered on test profiles because both profiles held the same user's face, with a hidden override button.
  - Status: Verified with `tsc --noEmit` (0 errors), pushed to GitHub.

- 2026-11-08: Quick Face Enrollment Auto-Capture (Fixed Stuck/No-Click on Detection)
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts`
    - `src/portal/modules/hr/HREnrollFaceModal.tsx`
  - Status: Verified with `tsc --noEmit` (0 errors).
