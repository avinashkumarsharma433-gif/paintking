# WORKING SET

- 2026-11-06: Strict Sequential Navigation in 6-Pose Face Enrollment
  - Files touched:
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Enforced step lock so Pose N cannot be accessed until Poses 1..N-1 are captured; disabled "Next >" button when current pose is pending, added "Back" navigation)
  - Search string: `const canNavigate = idx === 0 || POSE_STEPS.slice(0, idx).every(s => capturedPoses.some(p => p.stepId === s.id))`
  - Status: Verified with `npx tsc --noEmit` (0 errors), dev server running with clean HMR.

- 2026-11-06: Resolved "Cannot read properties of undefined (reading 'id')" exception boundary during face scanning
  - Files touched:
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Safe optional chaining `prev?.employee?.id === emp?.id`, safe `attendanceRecords` query guard)
    - `src/portal/views/HRSuiteView.tsx` (`handleRecordPunch` null guard on `employee` and `prev` attendance array filtering)
    - `src/portal/modules/hr/HRAttendanceRegister.tsx` & `HREmployeeDirectory.tsx` (Defensive `Boolean(r && r.id)` filters)
    - `src/portal/services/faceRecognitionService.ts` (`findBestFaceMatch` and `checkDuplicateFace` safe iteration)
    - `src/portal/PortalApp.tsx` (Enhanced error boundary with live stack trace)
  - Search string: `const safePrev = Array.isArray(prev) ? prev.filter((r): r is AttendanceRecord => Boolean(r && r.id)) : []`
  - Status: Verified with `npx tsc --noEmit` (0 errors), dev server running.

- 2026-11-06: Fix face detection horizontal mirror flip & expand kiosk viewport to full screen
  - Files touched:
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (`mirroredLeft = 100 - slot.box.x - slot.box.width`, expanded viewport `min-h-[500px] h-[580px] sm:h-[620px]`, full screen kiosk mode with `toggleFullscreen` and HTML5 Fullscreen API, responsive punch stream grid)
  - Search string: `mirroredLeft = Math.max(0, Math.min(100, 100 - slot.box.x - slot.box.width))`
  - Status: Verified with `npx tsc --noEmit` (0 errors), Vite dev server active with clean HMR.

- 2026-11-06: Phase 0 Completed - AI Recognition Lab, Quality Gate & Baseline Calibration
  - Files touched:
    - `src/portal/modules/hr/RecognitionLab.tsx` (Diagnostic FAR/FRR curve, EER threshold recommender, stage latency profiler, unknown attempt gallery)
    - `src/portal/services/faceRecognitionService.ts` (Calibrated confidence, Laplacian blur variance, exposure check, head pose estimator, quality gate, stage benchmark)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Non-mirrored raw capture, real-time quality gate feedback, 1-sec steady auto-capture, duplicate blocking with written override)
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Native un-stretched canvas, 3-frame agreement with margin check, heuristic liveness note, unknown attempt thumbnail logging)
    - `src/portal/types/hrAttendanceTypes.ts` & `src/portal/views/HRSuiteView.tsx` (Types & Admin tab navigation)
  - Status: Verified with `tsc --noEmit` (0 errors) and Vite production build passed.

- 2026-11-06: Interactive Guided 6-Pose Biometric Calibration (Replaced burst mode with visual directional instructions & on-screen hints)
  - Files touched:
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Interactive 6-pose stepper with dedicated icons, live visual arrows, and step guidance)
    - `src/portal/services/faceRecognitionService.ts` (`computeMasterVector` across 6 calibrated poses)
  - Features:
    - Pose 1: Straight & Neutral (Center oval)
    - Pose 2: Natural Smile (Smile icon)
    - Pose 3: Turn Head Left 20° (Live bouncing left arrow)
    - Pose 4: Turn Head Right 20° (Live bouncing right arrow)
    - Pose 5: Tilt Chin Up 15° (Live bouncing up arrow)
    - Pose 6: Glasses or Expression Check (Glasses icon)
  - Status: Verified with `tsc` (0 errors).
