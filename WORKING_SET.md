# WORKING SET

- 2026-11-06: Automatic 20-Photo Rapid Burst Face Enrollment & Duplicate Face Warning
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`checkDuplicateFace` cross-employee matching, `computeMasterVector` 20-vector synthesis)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Auto 20-Photo Rapid Scan in 3.5 seconds with live progress bar and duplicate alert)
    - `src/portal/views/HRSuiteView.tsx` (Passed `allEmployees` to enrollment modal)
  - Features:
    - 1-click automatic 20-photo capture (180ms interval)
    - Instant Duplicate Face Warning if already enrolled under another name
  - Status: Verified with `tsc` (0 errors).
