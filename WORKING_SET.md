# WORKING SET

- 2026-11-08: Calibrated Strict Duplicate Face Gate (Fixed False Positive on New Persons)
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`checkDuplicateFace`: uses strict Master Vector identity distance `<= 0.38` and pose minimum `<= 0.34` rather than comparing individual noisy poses at `0.46`)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Step 1 early duplicate check + finalize master vector security gate at `0.38`, preventing false positive alerts on new persons while reliably catching the same person)
  - Issue Diagnosed: `0.46` was matching accidental variance across 7 vectors between two completely different people, falsely flagging a new employee as a duplicate at step 6.
  - Status: Verified with `tsc --noEmit` (0 errors), dev server active on http://localhost:3000/.

- 2026-11-08: Duplicate Face Detection & Strict Enrollment Blocking Error
  - Files touched:
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (`duplicateError`: strict blocking on capture and finalize, full error modal displaying matched employee name, ID, and similarity %, with Try Another Person, Cancel, and Admin Override options)
  - Status: Verified with `tsc --noEmit` (0 errors).
