# Portal Services (`src/portal/services`)

## Overview
Domain services for biometric anti-spoofing, face recognition, geofencing, shift punch resolution, payroll calculation, encrypted IndexedDB biometric storage, Code 39 barcodes, PDF label/slip/ID card generation, CSV muster roll export, and speech synthesis.

## Interface
- `antiSpoofService.ts:LivenessChallengeType`, `LivenessChallenge`, `ChallengeEvaluationResult`, `LIVENESS_CHALLENGES`, `evaluatePassiveMicroLiveness`, `analyzePassiveSpoof`
- `boxLabelPdfService.ts:BoxLabelItem`, `getNextBoxCounterRange`, `getCurrentBoxCounter`, `generateMultiBoxThermalLabelPDF`, `generateA4SheetBoxLabelsPDF`
- `code39BarcodeService.ts:renderScannableCode39`
- `employeeIdCardPdfService.ts:generateEmployeeIdCardPDF`
- `faceRecognitionService.ts:FaceMatchResult`, `DetectedFaceSlot`, `loadFaceModels`, `areModelsLoaded`, `calculateEuclideanDistance`, `distanceToConfidence`, `computeLaplacianVariance`, `computeExposureScore`, `EnrollmentBaseline`
- `geofenceService.ts:PAINTKING_LOCATIONS`, `calculateHaversineDistance`, `getVerifiedDeviceLocation`
- `musterRollExportService.ts:exportPlantMusterRollCSV`
- `payrollCalculationService.ts:STANDARD_WORK_HOURS_PER_DAY`, `DEFAULT_DAILY_RATE`, `calculateEmployeeMonthlyPayroll`, `exportEmployeeMonthlyPayrollCSV`
- `payrollPdfService.ts:generateEmployeeSalarySlipPDF`
- `secureBiometricStorage.ts:IBiometricStorage`, `IndexedDBBiometricStorage`
- `shiftPunchService.ts:ShiftResolutionResult`, `isNightShift`, `getOperationalShiftDate`, `resolveShiftPunch`
- `voiceService.ts:VoiceAnnouncementOptions`, `voiceEngine`

## Invariants
- `[antiSpoofService.ts:evaluatePassiveMicroLiveness]` Static 2D photo/screen is flagged when `earDelta < 0.002` and `avgShiftPerFrame < 0.15` across 4+ rolling frames (up to 8 frames, `3500ms` expiry).
- `[boxLabelPdfService.ts:generateMultiBoxThermalLabelPDF]` Each label page is fixed to `65mm x 95mm` portrait.
- `[boxLabelPdfService.ts:generateA4SheetBoxLabelsPDF]` A4 layout is fixed to 3 columns x 3 rows (9 labels per page, `65mm x 95mm` each).
- `[code39BarcodeService.ts:renderScannableCode39]` Sanitizes input to valid Code 39 characters, wraps with `*` start/stop delimiters, enforces `>= 6.0mm` quiet zone, and caps narrow bar width at `0.40mm` with `2.5:1` wide-to-narrow ratio.
- `[faceRecognitionService.ts:calculateEuclideanDistance]` Returns `999` for empty/missing vectors; re-normalizes sub-vectors when comparing mixed vector lengths.
- `[faceRecognitionService.ts:distanceToConfidence]` Clamps output to `[0, 100]` using cosine similarity `1 - (distance^2)/2`.
- `[geofenceService.ts:getVerifiedDeviceLocation]` Location is verified only when Haversine distance `<= target.radiusMeters` (or `bypassForDev` is `true`).
- `[payrollCalculationService.ts:calculateEmployeeMonthlyPayroll]` `STANDARD_WORK_HOURS_PER_DAY` is `8.0`; Sundays without a punch record default to paid `ON_LEAVE`; OT is calculated only if `isOtEligible !== false` and `workHours > 8.0`.
- `[shiftPunchService.ts:getOperationalShiftDate]` Night shifts between `00:00` and `08:00` resolve to the previous calendar day.
- `[shiftPunchService.ts:resolveShiftPunch]` Enforces `minPunchGapMinutes` (default `15m`) cooldown between IN and OUT, `maxShiftDurationHours` (default `16h`) before starting a fresh IN, and prevents double IN in `FIXED_IN` mode or OUT without IN in `FIXED_OUT` mode.

## Side Effects
- `[antiSpoofService.ts:evaluatePassiveMicroLiveness]` Mutates module-level `Map` `faceMotionCache`.
- `[boxLabelPdfService.ts:getNextBoxCounterRange]` Reads and writes `localStorage` key `'pk_master_box_counter'`.
- `[boxLabelPdfService.ts:generateMultiBoxThermalLabelPDF]`, `[generateA4SheetBoxLabelsPDF]`, `[employeeIdCardPdfService.ts:generateEmployeeIdCardPDF]`, `[payrollPdfService.ts:generateEmployeeSalarySlipPDF]` Trigger browser PDF file download via `doc.save()`.
- `[faceRecognitionService.ts:loadFaceModels]` Fetches neural network weights from `'/models'`, initializes `arcFace512`, mutates module-level `modelsLoaded`/`modelLoadPromise`, and logs errors to `console.error`.
- `[geofenceService.ts:getVerifiedDeviceLocation]` Calls `navigator.geolocation.getCurrentPosition`.
- `[musterRollExportService.ts:exportPlantMusterRollCSV]`, `[payrollCalculationService.ts:exportEmployeeMonthlyPayrollCSV]` Trigger browser CSV download via DOM anchor click (and `window.alert()` if no employees match).
- `[secureBiometricStorage.ts:IndexedDBBiometricStorage]` Derives and caches WebCrypto PBKDF2/AES-GCM key, and reads/writes/deletes encrypted records in IndexedDB (`'pk_secure_biometrics_db'` / `'biometrics_vault'`).
- `[voiceService.ts:voiceEngine]` Accesses `window.speechSynthesis`, cancels ongoing utterances, and speaks audio announcements.

## Verification
- Run: `npm run lint && npm run build`
