# WORKING SET

- 2026-11-08: Calibrated Natural Smile & 10-15° Left/Right Turn Detection for Auto-Enrollment
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`estimateHeadPoseFromLandmarks` with biometric mouth aspect ratio, mouth-to-eye width ratio, and corner lift; calibrated `yaw >= 0.035` and `yaw <= -0.035` for natural 10-15° turns)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Auto-capture hold timer incremented to +25%/frame ~0.7s)
  - Issue Diagnosed: Smile previously required anatomically impossible `smileWidthRatio >= 1.02` and `mouthAspectRatio >= 0.22`. Left/right yaw previously required extreme 40° profile turn (`yaw >= 0.14`). Calibrated to natural human ranges.
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
