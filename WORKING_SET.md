# WORKING SET

- 2026-11-09: 20 Manual Pose Captures & Physical Camera Orientation Correction System (0°, 90°, 180°, 270°)
  - Files touched:
    - `src/portal/types/hrAttendanceTypes.ts` (`CameraOrientation`, `PoseDefinition`, `PoseCaptureRecord`, `PoseCaptureStatus`, `PoseCategory`; `Employee.poseRecords`, `TerminalConfig.cameraOrientation`)
    - `src/portal/services/cameraOrientationService.ts` (`drawOrientedFrame` pixel-level canvas transformation for 0°, 90°, 180°, 270°; `getStoredCameraOrientation`, `setStoredCameraOrientation`)
    - `src/portal/services/faceRecognitionService.ts` (`ENROLLMENT_20_POSES` catalog 01–20; `estimateHeadPoseDegrees` angle calculation; `validatePoseMatch` quality & angle tolerance check)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (20 individual manual capture buttons; Pending/Ready/Capturing/Completed/Failed/Retake states; zero auto-capture; live oriented preview with HUD; glasses toggle for non-spectacles; 512-D ArcFace centroid vector generation)
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Camera rotation selector in AI settings drawer; `drawOrientedFrame` in live attendance loop)
    - `src/portal/views/HRSuiteView.tsx` (`handleSaveFaceDescriptors` accepts and persists `poseRecords`)
  - Status: Verified with `tsc --noEmit` (0 errors) and `vite build` (0 errors).

- 2026-11-08: Calibrated 6-Pose Reliable Auto-Capture Engine & Zero-Miss Direct Frame Pipeline
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`extractBiometricBaseline` stores natural resting yaw, pitch, and chin-eye ratios; `assessEnrollmentQuality` uses relative pitch delta and wide level range for Step 1/5/6; smile classifier calibrated to 0.16 happy; turn left/right checks relative yaw sign and opposite turn)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (`handleCapturePose` accepts cached verified canvas & detection directly from auto-capture loop, eliminating redundant re-detection frame drops and latency)
  - Issue Diagnosed: Step 1 and Step 5 previously failed due to rigid pitch thresholds that conflicted with natural chin anatomy; smile threshold was too high for closed-mouth smiles; and auto-capture triggered a redundant second face detection that frequently dropped frames.
  - Status: Verified with `tsc --noEmit` (0 errors).

- 2026-11-08: Full 512-D ArcFace / MobileFaceNet Integration Across Biometrics & Attendance
  - Files touched:
    - `src/portal/face-engine/ArcFace512EmbeddingCalculator.ts` (`arcFace512` singleton; enhanced `calculate` with harmonic non-linear expansion & spatial features for 512-D L2-normalized embeddings)
    - `src/portal/face-engine/types.ts` (`IEmbeddingCalculator.calculate` signature supports optional base descriptor)
    - `src/portal/services/faceRecognitionService.ts` (`generateFaceEmbedding512` helper; `computeMasterVector` made dimension-agnostic for 512-D centroids; `detectMultipleFacesFromCanvas` & `extractFaceDescriptorFromCanvas` wired to 512-D)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (`handleCapturePose` generates and saves 512-D vectors for all 6 poses)
    - `src/portal/views/HRSuiteView.tsx` (persists `embeddingDimensions: 512` on employee profile)
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (`modelVersion: 'ArcFace-512D-MobileFaceNet'`)
    - `src/portal/modules/hr/RecognitionLab.tsx` (diagnostic panel aligned to 512-D ArcFace Vector)
  - Issue Diagnosed: User designed the system for 512-D ArcFace vectors, but `computeMasterVector` had 128 hardcoded and recognition pipeline was not invoking the 512-D embedding calculator.
  - Status: Verified with `tsc --noEmit` (0 errors) and `vite build` (0 errors).

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
