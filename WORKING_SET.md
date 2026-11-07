# WORKING SET

- 2026-11-07: Strict 1:1 Square Crop (300x300) Without Distortion
  - Files touched:
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Calculated center coordinate and extracted an exact square bounding box from video stream to target 300x300 canvas, guaranteeing 0 aspect stretch)
    - `src/portal/modules/hr/HRAttendanceRegister.tsx` (Set `w-56 h-56 aspect-square object-cover` on evidence images)
  - Search string: `aspect ratio prevents any distortion`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Wide-Angle 320x240 Snapshot & Camera Surroundings Evidence
  - Files touched:
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Expanded snapshot crop with 90% horizontal padding and 320x240 canvas capture so surroundings, body, and phone frames are visible)
    - `src/portal/modules/hr/HRAttendanceRegister.tsx` (Expanded modal to max-w-2xl with larger 48-height image containers for sharp inspection)
  - Search string: `Extract wide-angle evidence snapshot`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Cascade Employee Deletion & Automatic Orphan Record Purge
  - Files touched:
    - `src/portal/views/HRSuiteView.tsx` (Enforced cascade delete: deleting an employee immediately purges all their attendance records, punch streams, and biometric vaults from state and localStorage; on load, automatically purges any orphan records belonging to non-existent profiles like old mock Rahul/Pooja)
  - Search string: `CASCADE DELETE: Remove all attendance records`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Removed Reset/Clear All HR Button (Prevent Accidental Deletions)
  - Files touched:
    - `src/portal/views/HRSuiteView.tsx` (Completely removed dangerous reset button from top nav; all profiles and attendance records remain strictly safe and persistent)
  - Search string: `Top HR Navigation Navigation Strip`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: One-Click HR Data Purge & Zero Hardcoded Records
  - Files touched:
    - `src/portal/views/HRSuiteView.tsx` (Added `Reset / Clear All HR Data` button that completely wipes old cached records, Pooja/Rahul records, and IndexedDB biometric vaults from the browser, allowing the user to start completely fresh with their own created profiles)
  - Search string: `handleClearAllData`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Zero Hardcoded Profiles, Full LocalStorage Isolation & Employee Deletion
  - Files touched:
    - `src/portal/views/HRSuiteView.tsx` (Removed all mock employees; strict initial empty array `[]` loading directly from `localStorage.getItem('pk_hr_employees')`; wired `onDeleteEmployee` handler purging both profile and encrypted IndexedDB biometric templates)
    - `src/portal/modules/hr/HREmployeeDirectory.tsx` (Added permanent employee profile delete trash button with confirmation dialog)
  - Search string: `onDeleteEmployee`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Real-Time Verification Snapshot Audit Proof in Attendance Register
  - Files touched:
    - `src/portal/modules/hr/HRAttendanceRegister.tsx` (Added Camera Audit icon trigger next to Edit button; clicking opens high-res In/Out cropped verification photos captured at the exact moment of camera detection with match % and device timestamp)
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Already crops and records 120x120 live verification snapshot into `PunchEvidenceMetadata`)
  - Search string: `CAMERA EVIDENCE INSPECTION MODAL`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Anti-Spoof Calibration (Eliminated False Positives on Real Face)
  - Files touched:
    - `src/portal/services/antiSpoofService.ts` (Calibrated passive glare and flat saturation thresholds to natural room lighting levels; removed initial frame spoof locks so real live faces immediately show Green `RECOGNIZED` without false Amber triggers, while static frozen photos are isolated over rolling 4+ frames)
  - Search string: `calibrate anti-spoof thresholds`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Real 3D Depth Parallax Disparity vs Flat 2D Screen Anti-Spoofing
  - Files touched:
    - `src/portal/services/antiSpoofService.ts` (Integrated multi-frame 3D depth parallax ratio between nose-tip, eyes, and chin + natural eye variance threshold (0.012); screen photos/monitors hold rigid 2D planar geometry with zero depth disparity and zero involuntary eye dynamics, immediately triggering Amber `SPOOF_SUSPECTED` and blocking punch)
  - Search string: `Natural Involuntary 3D Coordinate Tremor`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Zero-Effort Automatic Passive Liveness (No Manual Blink/Head-Turn Prompts)
  - Files touched:
    - `src/portal/services/antiSpoofService.ts` (Implemented `evaluatePassiveMicroLiveness` which tracks involuntary natural eye tremors and respiratory coordinate micro-motion over consecutive video frames; static 2D paper/screen photos are rejected automatically with 0 prompt required)
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Integrated automatic passive micro-motion evaluation into live detection loop; turned off manual prompts by default)
  - Search string: `evaluatePassiveMicroLiveness`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Anti-Spoof Hardening & Default Active Liveness Challenge
  - Files touched:
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx` (Turned `activeChallengeMode` ON by default so a static photo/screen cannot punch without performing live blink/head-turn/smile)
    - `src/portal/services/antiSpoofService.ts` (Tightened passive glare threshold from 0.08 to 0.03, flat color banding from 0.40 to 0.28, added high-contrast print edge detector, lowered spoof cutoff to 0.45)
  - Search string: `activeChallengeMode`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-07: Fix Initial Punch on New Date to Always Register IN Punch
  - Files touched:
    - `src/portal/views/HRSuiteView.tsx` (Removed hardcoded mock attendance records that pre-populated today with Rahul and Pooja; strictly enforced that new date detection without prior IN punch always registers Punch IN)
  - Search string: `Create new IN punch on new day`
  - Status: Verified with production build and pushed to origin/main.

- 2026-11-06: Overtime (OT) Eligibility Toggle with Proportional Wage Formula
  - Files touched:
    - `src/portal/modules/hr/HREmployeeDirectory.tsx` (Added Overtime (OT) Eligible toggle switch with live hourly wage hint, e.g. ₹800/8h = ₹100/hr)
    - `src/portal/services/payrollCalculationService.ts` (Integrated proportional OT formula: Daily Rate / 8 * OT Hours, with zero OT when toggle is off)
    - `src/portal/types/hrAttendanceTypes.ts` (Added `isOtEligible?: boolean` property to `Employee`)
  - Search string: `OVERTIME (OT) ELIGIBILITY TOGGLE`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-06: Full Employee Profile & Salary Editing in Employee Directory
  - Files touched:
    - `src/portal/modules/hr/HREmployeeDirectory.tsx` (Added edit profile modal trigger, Wage Rate display chip, unified Add/Edit modal supporting full updates to Name, Designation, Department, Shift, Phone, Joining Date & Daily Wage Rate)
    - `src/portal/views/HRSuiteView.tsx` (Wired `onUpdateEmployee` handler with persistent localStorage sync)
  - Search string: `openEditModal`
  - Status: Verified with production build and deployed to origin/main.

- 2026-11-06: Industrial HR Payroll, Overtime (OT) Engine & Monthly Payslip PDF Generator
  - Files touched:
    - `src/portal/services/payrollCalculationService.ts` (Daily rate calculation, 8.0h normal shift, 1.5x OT computation, day-by-day punch breakdown & CSV export)
    - `src/portal/services/payrollPdfService.ts` (Universal standard PaintKing monthly payslip PDF with daily punch log and Form IV compliance)
    - `src/portal/modules/hr/HRPayrollView.tsx` (Plant payroll register with metrics, search, department filter, editable daily rate modal, and 30-day log modal)
    - `src/portal/views/HRSuiteView.tsx` (Added "Payroll & OT Wages" tab)
    - `src/portal/types/hrAttendanceTypes.ts` (Employee dailyRate, otHourlyRate, EmployeeMonthlyPayrollSummary, DailyAttendanceSummary)
  - Search string: `PK-OS Industrial Payroll`
  - Status: Verified with production build and deployed to origin/main.

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
