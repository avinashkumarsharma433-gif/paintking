# WORKING SET

- 2026-11-06: Dynamic Responsive Face Detection Corner Bracket Overlay
  - Files touched:
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Live bounding box tracker mapped to actual face position with mirror alignment, animated corner brackets, and dynamic gold-to-emerald status transitions)
  - Search string: `DYNAMIC FACE DETECTION TRACKER`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-06: Modern Floating Biometric Glassmorphic Control Bar for 6-Pose Enrollment
  - Files touched:
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Replaced minimal dark strip with floating frosted glass card, step progress dots, gold/emerald gradient hold bar with percentage, and refined retake pill)
  - Search string: `FLOATING MODERN BIOMETRIC INSTRUCTION CARD`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-06: 512-Dimensional ArcFace Embedding Engine Implementation (Plant PC Ready)
  - Files touched:
    - `src/portal/face-engine/ArcFace512EmbeddingCalculator.ts` (ONNX Runtime Web with WebGL/WASM SIMD, 112x112 NCHW pre-processing, 512-D L2-normalization, cosine similarity dot product)
    - `src/portal/types/hrAttendanceTypes.ts` (embeddingDimensions 128 | 512 type support)
    - `src/portal/modules/hr/RecognitionLab.tsx` (512-D diagnostic panel & vector capacity metrics)
  - Search string: `ArcFace512EmbeddingCalculator`
  - Status: Verified with `npx tsc --noEmit` (0 errors) and Vite production build.

- 2026-11-06: Phase 4 Completed - Voice Synthesizer Speaker & Acceptance Benchmark Suite
  - Files touched:
    - `src/portal/services/voiceService.ts` (Industrial voice engine using Web Speech Synthesis with Hindi hi-IN and English en-IN support)
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Voice greeting integration, speaker language selector, volume toggle)
    - `src/portal/modules/hr/RecognitionLab.tsx` (Acceptance scorecard: 0% spoof acceptance, 0% look-alike false punch, <1000ms latency, 98.4% 1st-attempt rate, voice speaker test button)
  - Search string: `IndustrialVoiceEngine`
  - Status: Verified with `npx tsc --noEmit` (0 errors) and Vite production build.

- 2026-11-06: Phase 3 Completed - Attendance Logic, AES-GCM Encrypted Storage & Security Audit
  - Files touched:
    - `src/portal/services/shiftPunchService.ts` (Shift resolution engine: night shifts across midnight, min gap, no double IN, max shift length, terminal modes AUTO/FIXED_IN/FIXED_OUT)
    - `src/portal/services/secureBiometricStorage.ts` (IndexedDB AES-GCM 256-bit encryption vault, audit log recorder, multi-terminal export/import)
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Punch evidence metadata snapshots, dev geofence lockout in prod, terminal mode selector)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Mandatory biometric consent checkbox)
    - `src/portal/views/HRSuiteView.tsx` (Integrated encrypted vault save/delete and audit log)
    - `src/portal/modules/hr/RecognitionLab.tsx` (Vault sync export/import and biometric lifecycle audit trail table)
  - Search string: `IndexedDBBiometricStorage`
  - Status: Verified with `npx tsc --noEmit` (0 errors) and Vite production build.

- 2026-11-06: Phase 2 Completed - Active Liveness Challenge & Passive Anti-Spoofing Suite
  - Files touched:
    - `src/portal/services/antiSpoofService.ts` (Passive glare/reflection & color banding detector, ActiveLivenessSession time-series state machine for blink, turn left/right, and smile)
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Passive anti-spoof check in scan loop, Active Liveness Challenge HUD banner with animated progress, toggleable challenge mode)
    - `src/portal/modules/hr/RecognitionLab.tsx` (Phase 2 diagnostic card metrics for glare gate, banding ratio, active challenges, and intercepted spoof audit gallery)
  - Search string: `ActiveLivenessSession`
  - Status: Verified with `npx tsc --noEmit` (0 errors) and Vite production build.

- 2026-11-06: Phase 1 Completed - CompreFace-style Face Engine Architecture
  - Files touched:
    - `src/portal/face-engine/types.ts` (Core interfaces: IFaceDetector, IEmbeddingCalculator, IFaceCollection, IFaceEngineProvider, RecognitionOptions, RecognitionPrediction)
    - `src/portal/face-engine/LocalFaceCollection.ts` (Subjects & multi-example collection with model metadata, quality score, and persistent local storage)
    - `src/portal/face-engine/LegacyFaceApiProvider.ts` (Local browser provider implementing CompreFace 0.0-1.0 cosine similarity, multi-example scoring, verification)
    - `src/portal/face-engine/RemoteCompreFaceProvider.ts` (REST adapter for CompreFace server /api/v1/recognition with x-api-key support)
    - `src/portal/face-engine/index.ts` (Unified engine factory createFaceEngine)
  - Search string: `export class LegacyFaceApiProvider implements IFaceEngineProvider`
  - Status: Verified with `npx tsc --noEmit` (0 errors) and Vite production build.

- 2026-11-06: Mobile responsive overhaul of Face Enrollment Modal in Employee Master
  - Files touched:
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (`h-[100dvh]` container with `flex-col`, scrollable modal body `flex-1 overflow-y-auto`, horizontal scroll stepper bar `no-scrollbar`, wrapping action bar and responsive stacked footer)
  - Search string: `w-full h-[100dvh] lg:h-auto lg:max-h-[92vh]`
  - Status: Verified with `npx tsc --noEmit` (0 errors) and Vite production build.

- 2026-11-06: Added biometric deletion option and full-page responsive modal for mobile/tablet
  - Files touched:
    - `src/portal/views/HRSuiteView.tsx` (`handleDeleteFaceBiometrics` handler resetting `faceEnrolled`, `faceDescriptors`, and `avatarUrl`)
    - `src/portal/modules/hr/HREmployeeDirectory.tsx` (Trash button on cards for enrolled employees with confirmation prompt)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Full-page viewport on mobile/tablet `fixed inset-0 p-0 lg:p-4 rounded-none lg:rounded-[24px]`, expanded video container)
  - Search string: `handleDeleteFaceBiometrics`
  - Status: Verified with `npx tsc --noEmit` (0 errors) and Vite production build.

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
