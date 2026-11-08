# WORKING SET

- 2026-11-08: Complete Pose Verification Engine (Neural Expression Net + Bi-Pupillary 3D Nose Triangulation)
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`loadFaceModels` loads `faceExpressionNet`; `estimateHeadPoseFromLandmarks` integrates deep learning smile detection + 3D eye-nose triangulation `eyeNoseYaw` and silhouette `jawYaw`; `assessEnrollmentQuality` strictly verifies each requested pose before capture)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (`withFaceExpressions()` chained on detection; step 3 records turn direction and step 4 validates opposite turn; auto-captures only once verified and held steady ~0.5s)
  - Issue Diagnosed: User required verified pose validation before snapshot. Loaded neural network `faceExpressionNet` for robust smile recognition and implemented 3D bi-pupillary nose triangulation for turn verification.
  - Status: Verified with `npm run lint` (0 errors), pushed to GitHub.

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
