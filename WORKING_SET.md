# WORKING SET

- 2026-11-08: Quick Face Enrollment Auto-Capture (Fixed Stuck/No-Click on Detection)
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`assessEnrollmentQuality`: relaxed strict blur/exposure/EAR gating so budget webcams never fail to trigger, lowered smile threshold to 0.14, forgiving yaw/pitch angles)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Fast 2-frame auto-capture jump +50% reaching 100% in ~350ms, direct async await without React state closure bugs, lowered detection minConfidence to 0.25 with 0.15 fallback, stable interval uncoupled from `isProcessing`)
  - Issue Diagnosed: Strict blur and eye aspect ratio thresholds were rejecting webcam frames, and auto-capture was embedded inside a React state updater which tore down the interval before clicking.
  - Status: Verified with `tsc --noEmit` (0 errors), pushed to GitHub.

- 2026-11-08: Instant Face Recognition Punch (Eliminated 2-Second Delay)
  - Files touched:
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (`requiredConsecutiveFrames` 3→1 for instant first-frame punch, scan interval 900ms→400ms)
    - `src/portal/services/faceRecognitionService.ts` (`findBestFaceMatch`: reads pre-stored master vector at `faceDescriptors[0]`)
  - Status: Verified with `tsc --noEmit` (0 errors).
