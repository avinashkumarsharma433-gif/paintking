# WORKING SET

- 2026-11-08: Relative Biometric Baseline Smile & Orientation-Agnostic Opposing Turn Auto-Capture
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`extractBiometricBaseline` from Step 1 neutral face to detect smile via relative lip widening/opening/corner lift; Step 3 accepts horizontal turn `|yaw| >= 0.022` and Step 4 enforces opposing turn relative to Step 3 sign)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (`baselineRef` tracked across steps, hold timer +34%/frame ~0.5s auto-capture)
  - Issue Diagnosed: Webcams/mirroring caused yaw sign mismatch between physical and canvas space, causing Left/Right to always reject. Smile without baseline comparison failed for faces with narrower lips. Dynamic baseline comparison and relative opposing-turn tracking solves both unconditionally.
  - Status: Verified with `tsc --noEmit` (0 errors), pushed to GitHub.

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
